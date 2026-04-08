import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import twilio from "twilio";
import { billingMonthStart, planLimitSeconds } from "@/lib/plan-limits";
import { unlinkVapiPhoneWithFallback } from "@/lib/vapi-client";

/**
 * POST /api/webhooks/vapi
 *
 * Receives end-of-call-report events from Vapi.
 * Routes to the correct client by looking up the called phone number in client_config.
 *
 * Vapi payload shape:
 * {
 *   message: {
 *     type: "end-of-call-report",
 *     artifact: {
 *       structuredData: { outcome, callerName, appointmentTime?, ...nicheFields }
 *     },
 *     call: {
 *       to: string,        // business number dialed (E.164)
 *       from: string,      // caller number (E.164)
 *       id: string,        // Vapi call SID
 *       startedAt: string,
 *       endedAt: string,
 *       recordingUrl?: string,
 *     }
 *   }
 * }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.message) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { message } = body;

  // Only handle end-of-call reports
  if (message.type !== "end-of-call-report") {
    return NextResponse.json({ received: true });
  }

  const call = message.call;
  const toNumber: string = call?.to;
  const fromNumber: string = call?.from;
  const callSid: string = call?.id;

  if (!toNumber || !fromNumber) {
    return NextResponse.json({ error: "Missing to/from numbers" }, { status: 400 });
  }

  // 1. Resolve client from the business phone number that was dialed
  const config = await prisma.clientConfig.findUnique({
    where: { vapiPhoneNumber: toNumber },
    include: { client: true },
  });

  if (!config) {
    console.warn(`[vapi-webhook] No client config for number: ${toNumber}`);
    return NextResponse.json({ received: true, warning: "No client config found" });
  }

  // If the client is plan-capped (active=false, not manually suspended), skip processing.
  // The phone is already unlinked so this is a safety-net path only.
  if (!config.active && !config.planCapOverride) {
    console.warn(`[vapi-webhook] Client ${config.clientId} is plan-capped — skipping`);
    return NextResponse.json({ received: true, warning: "Client plan cap active" });
  }

  const clientId = config.clientId;

  // 2. Parse call metadata
  const startedAt = call.startedAt ? new Date(call.startedAt) : new Date();
  const endedAt = call.endedAt ? new Date(call.endedAt) : new Date();
  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

  // Vapi puts structuredDataSchema results in message.artifact.structuredData
  // Fall back to call.analysis.structuredData for legacy compatibility
  const artifact = message.artifact ?? {};
  const structured = artifact.structuredData ?? call.analysis?.structuredData ?? {};

  const rawOutcome: string = (structured.outcome ?? "NEW_LEAD")
    .toUpperCase()
    .replace(/-/g, "_")
    .replace(/ /g, "_");

  const outcomeMap: Record<string, string> = {
    APPOINTMENT_BOOKED: "APPOINTMENT_BOOKED",
    CALLBACK_REQUESTED: "CALLBACK_REQUESTED",
    NOT_INTERESTED: "NOT_INTERESTED",
    WRONG_NUMBER: "WRONG_NUMBER",
    VOICEMAIL: "VOICEMAIL",
    NO_ANSWER: "NO_ANSWER",
    NEW_LEAD: "NEW_LEAD",
    FAQ_HANDLED: "FAQ_HANDLED",
    // Vapi structured output variants → mapped to nearest enum
    APPOINTMENT_CHANGED: "CALLBACK_REQUESTED",
    APPOINTMENT_CANCELLED: "CALLBACK_REQUESTED",
    FAQ_ONLY: "FAQ_HANDLED",
  };
  const outcome = outcomeMap[rawOutcome] ?? "NEW_LEAD";

  const callerName: string | null = structured.callerName ?? null;
  const transcriptUrl: string | null = call.recordingUrl ?? null;

  // Extract niche-specific intel — everything except the 3 core fields
  const coreKeys = new Set(["outcome", "callerName", "appointmentTime"]);
  const nicheIntel = Object.fromEntries(
    Object.entries(structured).filter(([k]) => !coreKeys.has(k))
  );
  const qualificationData: Prisma.InputJsonObject | null =
    Object.keys(nicheIntel).length > 0 ? (nicheIntel as Prisma.InputJsonObject) : null;

  // Derive appointment type from niche intel based on industry
  function resolveAppointmentType(industry: string | null, data: Record<string, unknown> | null): string | null {
    if (!data) return null;
    if (industry === "DENTAL") return typeof data.procedureType === "string" ? data.procedureType : null;
    if (industry === "ROOFING" || industry === "HVAC") return typeof data.serviceType === "string" ? data.serviceType : null;
    return null;
  }
  const appointmentType = resolveAppointmentType(config.client.industry, nicheIntel);

  // 3. Find or create lead record for this caller
  let lead = await prisma.lead.findFirst({
    where: { clientId, contactPhone: fromNumber },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        clientId,
        contactName: callerName,
        contactPhone: fromNumber,
        source: "inbound_call",
        status: "NEW",
        qualificationData: qualificationData ?? undefined,
      },
    });
  } else {
    // Update name if we just learned it, and always refresh qualificationData with latest call
    lead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        ...(callerName && !lead.contactName ? { contactName: callerName } : {}),
        ...(qualificationData ? { qualificationData } : {}),
        lastContacted: new Date(),
      },
    });
  }

  // 4. Write call log with qualificationData
  const callLog = await prisma.callLog.create({
    data: {
      clientId,
      callSid,
      callerName,
      callerPhone: fromNumber,
      durationSeconds,
      outcome: outcome as import("@prisma/client").CallOutcome,
      transcriptUrl,
      qualificationData: qualificationData ?? undefined,
      timestamp: startedAt,
    },
  });

  // 4b. Plan cap enforcement — check if this call pushed the client over their monthly hour limit.
  //     Runs after the call log is written so usage includes the current call.
  //     ENTERPRISE and planCapOverride clients are exempt.
  if (config.client.plan !== "ENTERPRISE" && !config.planCapOverride) {
    const limitSeconds = planLimitSeconds(config.client.plan);
    if (isFinite(limitSeconds)) {
      const monthStart = billingMonthStart();
      const agg = await prisma.callLog.aggregate({
        where: { clientId, createdAt: { gte: monthStart } },
        _sum: { durationSeconds: true },
      });
      const usedSeconds = agg._sum.durationSeconds ?? 0;

      if (usedSeconds >= limitSeconds) {
        // Disable in DB
        await prisma.clientConfig.update({
          where: { clientId },
          data: { active: false },
        });

        // Unlink Vapi phone (route to fallback so callers still reach a human)
        let capError: string | null = null;
        if (config.vapiPhoneNumberId) {
          const fallback = config.client.emergencyPhone ?? null;
          try {
            if (fallback) {
              await unlinkVapiPhoneWithFallback(config.vapiPhoneNumberId, fallback);
            } else {
              // No fallback number configured — just unlink
              await unlinkVapiPhoneWithFallback(config.vapiPhoneNumberId, "");
            }
          } catch (err) {
            capError = err instanceof Error ? err.message : String(err);
            console.error("[vapi-webhook] Plan cap Vapi unlink failed:", capError);
          }
        } else {
          capError = "vapiPhoneNumberId not set — manual Vapi unlink required";
          console.warn(`[vapi-webhook] ${capError} for client ${clientId}`);
        }

        await prisma.automationRun.create({
          data: {
            workflowName: "plan-limit-enforcement",
            clientId,
            status: capError ? "completed_with_warnings" : "completed",
            startedAt: new Date(),
            completedAt: new Date(),
            errorMessage: capError,
          },
        });

        console.log(`[vapi-webhook] Plan cap reached for client ${clientId} — used ${usedSeconds}s / ${limitSeconds}s`);
        // Do NOT return early — finish processing this call (SMS, n8n) before disabling
      }
    }
  }

  // 5. Appointment records are created mid-call by the bookAppointment tool (status: CONFIRMED,
  //    with calendar_event_id). No duplicate creation here — just update appointmentType if set.
  if (outcome === "APPOINTMENT_BOOKED" && appointmentType) {
    await prisma.appointment.updateMany({
      where: { clientId, callerPhone: fromNumber, status: "CONFIRMED" },
      data: { appointmentType },
    });
  }

  // 6. Send SMS follow-up if template configured
  if (
    config.twilioFromNumber &&
    config.followupSmsTemplate &&
    outcome !== "NOT_INTERESTED" &&
    outcome !== "WRONG_NUMBER"
  ) {
    const messageBody = (config.followupSmsTemplate ?? "")
      .replace("{caller_name}", callerName ?? "there")
      .replace("{business_name}", config.client.businessName);

    const followup = await prisma.followup.create({
      data: {
        clientId,
        callLogId: callLog.id,
        channel: "sms",
        messageBody,
        status: "PENDING",
      },
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      try {
        const twilioClient = twilio(accountSid, authToken);
        const msg = await twilioClient.messages.create({
          body: messageBody,
          from: config.twilioFromNumber,
          to: fromNumber,
        });
        await prisma.followup.update({
          where: { id: followup.id },
          data: { status: "SENT", twilioSid: msg.sid, sentAt: new Date() },
        });
      } catch (err) {
        console.error("[vapi-webhook] Twilio SMS failed:", err);
        await prisma.followup.update({
          where: { id: followup.id },
          data: { status: "FAILED" },
        });
      }
    } else {
      console.warn("[vapi-webhook] TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set — SMS skipped");
    }
  }

  // 7. Log automation run
  await prisma.automationRun.create({
    data: {
      workflowName: "inbound-call-handler",
      clientId,
      status: "completed",
      startedAt,
      completedAt: new Date(),
    },
  });

  // 8. Trigger inbound-lead-capture n8n workflow (async — fire and forget)
  //    Handles Claude intent scoring + scheduled_followups
  const n8nWebhookUrl = process.env.N8N_INBOUND_LEAD_CAPTURE_URL ??
    "http://76.13.111.46:32771/webhook/inbound-lead-capture";

  const transcript: string =
    (message.artifact?.transcript as string) ??
    (message.artifact?.messages as Array<{role:string;message:string}>|undefined)
      ?.map((m) => `${m.role}: ${m.message}`)
      .join("\n") ?? "";

  fetch(n8nWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId,
      callerPhone: fromNumber,
      callerName: callerName ?? "",
      transcript,
      qualificationData: qualificationData ?? {},
      clientConfig: {
        client_id: config.clientId,
        timezone: config.timezone,
        twilio_from_number: config.twilioFromNumber,
      },
    }),
  }).catch((err) =>
    console.error("[vapi-webhook] inbound-lead-capture call failed:", err)
  );

  return NextResponse.json({ received: true, callLogId: callLog.id, clientId, outcome });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

  if (!config || !config.active) {
    console.warn(`[vapi-webhook] No active client config for number: ${toNumber}`);
    return NextResponse.json({ received: true, warning: "No client config found" });
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

  // 5. If appointment booked — create appointment record
  if (outcome === "APPOINTMENT_BOOKED" && structured.appointmentTime) {
    const scheduledAt = new Date(structured.appointmentTime);
    if (!isNaN(scheduledAt.getTime())) {
      await prisma.appointment.create({
        data: {
          clientId,
          callerName,
          callerPhone: fromNumber,
          scheduledAt,
          calendarType: config.calendarType,
          appointmentType: appointmentType ?? undefined,
          status: "PENDING_CONFIRMATION",
        },
      });
    }
  }

  // 6. Queue SMS follow-up if template configured
  if (
    config.twilioFromNumber &&
    config.followupSmsTemplate &&
    outcome !== "NOT_INTERESTED" &&
    outcome !== "WRONG_NUMBER"
  ) {
    const messageBody = (config.followupSmsTemplate ?? "")
      .replace("{caller_name}", callerName ?? "there")
      .replace("{business_name}", config.client.businessName);

    await prisma.followup.create({
      data: {
        clientId,
        callLogId: callLog.id,
        channel: "sms",
        messageBody,
        status: "PENDING",
      },
    });
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

  return NextResponse.json({ received: true, callLogId: callLog.id, clientId, outcome });
}

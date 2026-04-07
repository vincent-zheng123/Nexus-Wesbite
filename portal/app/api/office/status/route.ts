import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEffectiveClientId } from "@/lib/getClientId";

export type OfficeAgentState = "idle" | "call" | "processing" | "email";

/**
 * GET /api/office/status
 *
 * Returns the real-time state of the AI receptionist for the current client.
 *
 * State resolution order:
 *   1. "call"       — Vapi has an active/ringing call right now
 *   2. "email"      — a followup (SMS/email) was sent in the last 90 seconds
 *   3. "processing" — a call log was created in the last 45 seconds (post-call processing)
 *   4. "idle"       — none of the above
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getEffectiveClientId(session.user);
  if (!clientId) return NextResponse.json({ state: "idle" as OfficeAgentState });

  const config = await prisma.clientConfig.findUnique({
    where: { clientId },
    select: { vapiAssistantId: true },
  });

  const vapiKey = process.env.VAPI_API_KEY;
  const vapiBase = process.env.VAPI_BASE_URL ?? "https://api.vapi.ai";

  // ── 1. Active Vapi call ────────────────────────────────────────────────────
  if (config?.vapiAssistantId && vapiKey) {
    try {
      const res = await fetch(
        `${vapiBase}/call?assistantId=${config.vapiAssistantId}&limit=10`,
        {
          headers: { Authorization: `Bearer ${vapiKey}` },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const calls: { status?: string; id?: string }[] = Array.isArray(data)
          ? data
          : (data.results ?? []);
        const active = calls.find(
          (c) => c.status === "in-progress" || c.status === "ringing"
        );
        if (active) {
          return NextResponse.json({
            state: "call" as OfficeAgentState,
            callId: active.id,
          });
        }
      }
    } catch {
      // Vapi unreachable — fall through to DB checks
    }
  }

  const now = new Date();
  const ninetySecondsAgo = new Date(now.getTime() - 90_000);
  const fortyFiveSecondsAgo = new Date(now.getTime() - 45_000);

  // ── 2. Recent followup sent (SMS/email state) ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentFollowup = await (prisma.followup as any).findFirst({
    where: { clientId, sentAt: { gte: ninetySecondsAgo } },
    orderBy: { sentAt: "desc" },
  });
  if (recentFollowup) {
    return NextResponse.json({ state: "email" as OfficeAgentState });
  }

  // ── 3. Recent call log (post-call processing state) ───────────────────────
  const recentCall = await prisma.callLog.findFirst({
    where: { clientId, createdAt: { gte: fortyFiveSecondsAgo } },
    orderBy: { createdAt: "desc" },
  });
  if (recentCall) {
    return NextResponse.json({ state: "processing" as OfficeAgentState });
  }

  // ── 4. Idle ────────────────────────────────────────────────────────────────
  return NextResponse.json({ state: "idle" as OfficeAgentState });
}

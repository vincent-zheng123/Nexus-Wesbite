import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getNicheDisplayFields } from "@/lib/niches";
import type { Prisma } from "@prisma/client";
import { getEffectiveClientIdFromRequest } from "@/lib/getClientId";
import { TranscriptToggle } from "./TranscriptRow";

function outcomeColor(outcome: string) {
  const map: Record<string, string> = {
    APPOINTMENT_BOOKED: "#4ade80",
    NEW_LEAD: "#a78bfa",
    CALLBACK_REQUESTED: "#fbbf24",
    VOICEMAIL: "#94a3b8",
    NO_ANSWER: "#94a3b8",
    NOT_INTERESTED: "#f87171",
    WRONG_NUMBER: "#f87171",
    FAQ_HANDLED: "#38bdf8",
  };
  return map[outcome] ?? "#a78bfa";
}

export default async function CallsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientIdFromRequest(user);
  if (!clientId) redirect("/admin");

  // Fetch client to get industryType for niche field rendering
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { industry: true },
  });

  const industryType = client?.industry ?? null;
  const nicheFields = industryType ? await getNicheDisplayFields(industryType) : [];

  const calls = await prisma.callLog.findMany({
    where: { clientId },
    orderBy: { timestamp: "desc" },
    take: 100,
    select: {
      id: true,
      callerName: true,
      callerPhone: true,
      timestamp: true,
      durationSeconds: true,
      outcome: true,
      transcriptUrl: true,
      transcript: true,
      qualificationData: true,
    },
  });

  return (
    <div className="p-8 max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Call Log</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>All inbound calls handled by your AI receptionist</p>
      </div>

      <div className="rounded-2xl border overflow-x-auto" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        {calls.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📞</p>
            <p className="text-sm" style={{ color: "#a78bfa" }}>No calls yet. Your AI receptionist is standing by.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                {["Caller", "Date & Time", "Duration", "Outcome", ...nicheFields.map((f) => f.label), "Transcript"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase whitespace-nowrap" style={{ color: "#6b6b80" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => {
                const qData = call.qualificationData as Prisma.JsonObject | null;

                return (
                  <tr key={call.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: "#f3f0ff" }}>{call.callerName ?? "—"}</p>
                      <p className="text-xs" style={{ color: "#6b6b80" }}>{call.callerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>
                      {call.timestamp.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>
                      {call.durationSeconds != null ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${outcomeColor(call.outcome)}18`, color: outcomeColor(call.outcome) }}>
                        {call.outcome.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>

                    {/* Dynamic niche intel columns */}
                    {nicheFields.map((field) => {
                      const rawVal = qData ? qData[field.key] : null;
                      const displayVal = field.render(rawVal);
                      return (
                        <td key={field.key} className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: rawVal != null ? "#f3f0ff" : "#3a3a50" }}>
                          {displayVal}
                        </td>
                      );
                    })}

                    <td className="px-5 py-3.5 min-w-[160px] max-w-[400px]">
                      <TranscriptToggle
                        transcript={call.transcript ?? null}
                        transcriptUrl={call.transcriptUrl ?? null}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

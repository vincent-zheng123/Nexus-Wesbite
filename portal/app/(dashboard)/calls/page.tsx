import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getEffectiveClientIdFromRequest } from "@/lib/getClientId";
import { TranscriptToggle } from "./TranscriptRow";


export default async function CallsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientIdFromRequest(user);
  if (!clientId) redirect("/admin");

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
      transcriptUrl: true,
      transcript: true,
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
                {["Caller", "Date & Time", "Duration", "Transcript"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase whitespace-nowrap" style={{ color: "#6b6b80" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium" style={{ color: "#f3f0ff" }}>{call.callerName ?? "—"}</p>
                    <p className="text-xs" style={{ color: "#6b6b80" }}>{call.callerPhone}</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>
                    {call.timestamp.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>
                    {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : "—"}
                  </td>
                  <td className="px-5 py-3.5 min-w-[160px] max-w-[500px]">
                    <TranscriptToggle
                      transcript={call.transcript ?? null}
                      transcriptUrl={call.transcriptUrl ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getNicheDisplayFields } from "@/lib/niches";
import { getEffectiveClientIdFromRequest } from "@/lib/getClientId";
import type { Prisma } from "@prisma/client";
import LeadStatusSelector from "@/components/dashboard/LeadStatusSelector";

const outcomeColor: Record<string, string> = {
  APPOINTMENT_BOOKED: "#4ade80",
  NEW_LEAD: "#a78bfa",
  CALLBACK_REQUESTED: "#fbbf24",
  VOICEMAIL: "#94a3b8",
  NO_ANSWER: "#94a3b8",
  NOT_INTERESTED: "#f87171",
  WRONG_NUMBER: "#f87171",
  FAQ_HANDLED: "#38bdf8",
};

const statusColor: Record<string, string> = {
  NEW: "#a78bfa",
  CONTACTED: "#38bdf8",
  FOLLOW_UP_1: "#fbbf24",
  FOLLOW_UP_2: "#fb923c",
  SEQUENCE_COMPLETE: "#94a3b8",
  CONVERTED: "#4ade80",
  NOT_QUALIFIED: "#f87171",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const clientId = await getEffectiveClientIdFromRequest(session.user);
  if (!clientId) redirect("/admin");

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead || lead.clientId !== clientId) notFound();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { industry: true },
  });

  const nicheFields = client?.industry ? await getNicheDisplayFields(client.industry) : [];

  const callHistory = lead.contactPhone
    ? await prisma.callLog.findMany({
        where: { clientId, callerPhone: lead.contactPhone },
        orderBy: { timestamp: "desc" },
        take: 20,
      })
    : [];

  const qData = lead.qualificationData as Prisma.JsonObject | null;
  const statusClr = statusColor[lead.status] ?? "#a78bfa";

  return (
    <div className="p-8">
      {/* Back */}
      <a href="/leads" className="text-xs mb-6 inline-block" style={{ color: "#a855f7" }}>
        ← Back to Leads
      </a>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}
          >
            {lead.contactName ?? lead.businessName ?? "Unknown Caller"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b80" }}>
            {lead.contactPhone ?? "—"}
            {lead.contactEmail ? ` · ${lead.contactEmail}` : ""}
          </p>
        </div>
        <span
          className="text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: `${statusClr}18`, color: statusClr }}
        >
          {lead.status.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      {/* Status selector */}
      <div className="rounded-2xl border p-5 mb-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: "#6b6b80" }}>
          Update Status
        </p>
        <LeadStatusSelector leadId={lead.id} currentStatus={lead.status} />
      </div>

      {/* Contact info */}
      <div className="rounded-2xl border p-5 mb-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: "#6b6b80" }}>
          Contact Info
        </p>
        <div className="space-y-2 text-sm">
          {[
            ["Source", lead.source ?? "—"],
            ["Location", lead.location ?? "—"],
            ["Business", lead.businessName ?? "—"],
            ["Website", lead.website ?? "—"],
            ["Added", lead.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
            ["Last Contacted", lead.lastContacted
              ? lead.lastContacted.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between py-2 border-b last:border-0"
              style={{ borderColor: "rgba(168,85,247,0.08)" }}
            >
              <span style={{ color: "#a78bfa" }}>{label}</span>
              <span style={{ color: "#f3f0ff" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Niche intel */}
      {nicheFields.length > 0 && (
        <div className="rounded-2xl border p-5 mb-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: "#6b6b80" }}>
            Intel Gathered
          </p>
          <div className="space-y-2 text-sm">
            {nicheFields.map((field) => {
              const raw = qData ? qData[field.key] : undefined;
              return (
                <div
                  key={field.key}
                  className="flex justify-between py-2 border-b last:border-0"
                  style={{ borderColor: "rgba(168,85,247,0.08)" }}
                >
                  <span style={{ color: "#a78bfa" }}>{field.label}</span>
                  <span style={{ color: raw != null ? "#f3f0ff" : "#3a3a50" }}>
                    {field.render(raw ?? null)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Call history */}
      <div className="rounded-2xl border p-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: "#6b6b80" }}>
          Call History
        </p>
        {callHistory.length === 0 ? (
          <p className="text-sm" style={{ color: "#6b6b80" }}>No calls recorded for this contact.</p>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call) => {
              const clr = outcomeColor[call.outcome] ?? "#a78bfa";
              return (
                <div
                  key={call.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-0"
                  style={{ borderColor: "rgba(168,85,247,0.08)" }}
                >
                  <div>
                    <p className="text-sm" style={{ color: "#f3f0ff" }}>
                      {call.timestamp.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs" style={{ color: "#6b6b80" }}>
                      {call.durationSeconds != null
                        ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                      style={{ background: `${clr}18`, color: clr }}
                    >
                      {call.outcome.replace(/_/g, " ").toLowerCase()}
                    </span>
                    {call.transcriptUrl && (
                      <a
                        href={call.transcriptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline"
                        style={{ color: "#a855f7" }}
                      >
                        Transcript
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

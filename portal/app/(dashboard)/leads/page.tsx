import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getNicheDisplayFields } from "@/lib/niches";
import type { Prisma } from "@prisma/client";
import { getEffectiveClientIdFromRequest } from "@/lib/getClientId";
import { LeadStatusBadge } from "./LeadStatusBadge";



export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  // Admin in preview mode falls through to the client view below
  const clientId = await getEffectiveClientIdFromRequest(user);
  if (!clientId) redirect("/admin");

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { industry: true },
  });

  const industryType = client?.industry ?? null;
  const nicheFields = industryType ? await getNicheDisplayFields(industryType) : [];

  const leads = await prisma.lead.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const staticHeaders = ["Name", "Phone", "Source", "Stage", "Date"];
  const nicheHeaders = nicheFields.map((f) => f.label);

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Clients</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
          Customers captured by your AI receptionist
          {industryType && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(168,85,247,0.15)", color: "#a78bfa" }}>
              {industryType.charAt(0) + industryType.slice(1).toLowerCase()}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Clients", value: leads.length, color: "#a855f7" },
          { label: "In Pipeline", value: leads.filter((l) => l.status === "CONVERTED").length, color: "#4ade80" },
          { label: "Booked", value: leads.filter((l) => l.status === "BOOKED").length, color: "#38bdf8" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border p-4" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
            <p className="text-2xl font-black mb-0.5" style={{ fontFamily: "var(--font-orbitron)", color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6b6b80" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 rounded-2xl border overflow-auto min-h-0 flex flex-col" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
              {[...staticHeaders, ...nicheHeaders].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase whitespace-nowrap" style={{ color: "#6b6b80" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          {leads.length > 0 && (
            <tbody>
              {leads.map((lead) => {
                const qData = lead.qualificationData as Prisma.JsonObject | null;

                return (
                  <tr key={lead.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
                    <td className="px-5 py-3.5">
                      <a href={`/leads/${lead.id}`}>
                        <p className="font-medium hover:underline" style={{ color: "#f3f0ff" }}>{lead.contactName ?? lead.businessName ?? "—"}</p>
                      </a>
                      <p className="text-xs" style={{ color: "#6b6b80" }}>{lead.contactEmail ?? ""}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>{lead.contactPhone ?? "—"}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>{lead.source ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <LeadStatusBadge leadId={lead.id} initialStatus={lead.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#6b6b80" }}>
                      {lead.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    {nicheFields.map((field) => {
                      const rawVal = qData ? qData[field.key] : null;
                      const displayVal = field.render(rawVal);
                      return (
                        <td key={field.key} className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: rawVal != null ? "#f3f0ff" : "#3a3a50" }}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
        {leads.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f3f0ff" }}>No clients yet</p>
            <p className="text-xs" style={{ color: "#6b6b80" }}>Clients captured by your AI receptionist will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

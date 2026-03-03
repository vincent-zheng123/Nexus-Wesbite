import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getNicheDisplayFields } from "@/lib/niches";
import type { Prisma } from "@prisma/client";
import { getEffectiveClientId } from "@/lib/getClientId";

const statusColor: Record<string, string> = {
  NEW: "#a78bfa",
  CONTACTED: "#38bdf8",
  FOLLOW_UP_1: "#fbbf24",
  FOLLOW_UP_2: "#fb923c",
  SEQUENCE_COMPLETE: "#94a3b8",
  CONVERTED: "#4ade80",
  NOT_QUALIFIED: "#f87171",
};

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientId(user);
  if (!clientId) redirect("/admin");

  // Fetch client to get industryType for niche field rendering
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

  // Static columns always shown
  const staticHeaders = ["Name", "Phone", "Source", "Status", "Date"];
  // Dynamic niche headers
  const nicheHeaders = nicheFields.map((f) => f.label);

  return (
    <div className="p-8 max-w-full mx-auto">
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

      <div className="rounded-2xl border overflow-x-auto" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-sm" style={{ color: "#a78bfa" }}>No leads captured yet.</p>
          </div>
        ) : (
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
            <tbody>
              {leads.map((lead) => {
                const color = statusColor[lead.status] ?? "#a78bfa";
                const qData = lead.qualificationData as Prisma.JsonObject | null;

                return (
                  <tr key={lead.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
                    {/* Static columns */}
                    <td className="px-5 py-3.5">
                      <a href={`/leads/${lead.id}`}>
                        <p className="font-medium hover:underline" style={{ color: "#f3f0ff" }}>{lead.contactName ?? lead.businessName ?? "—"}</p>
                      </a>
                      <p className="text-xs" style={{ color: "#6b6b80" }}>{lead.contactEmail ?? ""}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "#a78bfa" }}>{lead.contactPhone ?? "—"}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>{lead.source ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: `${color}18`, color }}>
                        {lead.status.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "#6b6b80" }}>
                      {lead.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

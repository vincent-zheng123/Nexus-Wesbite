import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP_1: "Follow-up 1",
  FOLLOW_UP_2: "Follow-up 2",
  SEQUENCE_COMPLETE: "Sequence Done",
  CONVERTED: "Converted",
  NOT_QUALIFIED: "Not Qualified",
};

const statusColor: Record<string, string> = {
  NEW: "#a78bfa",
  CONTACTED: "#38bdf8",
  FOLLOW_UP_1: "#fbbf24",
  FOLLOW_UP_2: "#f97316",
  SEQUENCE_COMPLETE: "#6b6b80",
  CONVERTED: "#4ade80",
  NOT_QUALIFIED: "#f87171",
};

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const q = searchParams.q?.toLowerCase() ?? "";
  const statusFilter = searchParams.status ?? "";

  const allLeads = await prisma.lead.findMany({
    where: { clientId: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      businessName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      industry: true,
      location: true,
      source: true,
      icpScore: true,
      status: true,
      createdAt: true,
    },
  });

  const leads = allLeads.filter((l) => {
    const matchesStatus = statusFilter ? l.status === statusFilter : true;
    const matchesSearch = q
      ? (l.businessName ?? "").toLowerCase().includes(q) ||
        (l.contactName ?? "").toLowerCase().includes(q) ||
        (l.contactEmail ?? "").toLowerCase().includes(q) ||
        (l.contactPhone ?? "").includes(q)
      : true;
    return matchesStatus && matchesSearch;
  });

  const total = allLeads.length;
  const newCount = allLeads.filter((l) => l.status === "NEW").length;
  const contacted = allLeads.filter((l) => l.status === "CONTACTED" || l.status === "FOLLOW_UP_1" || l.status === "FOLLOW_UP_2").length;
  const converted = allLeads.filter((l) => l.status === "CONVERTED").length;

  const stats = [
    { label: "Total Leads", value: total, color: "#a855f7" },
    { label: "New", value: newCount, color: "#a78bfa" },
    { label: "In Pipeline", value: contacted, color: "#38bdf8" },
    { label: "Converted", value: converted, color: "#4ade80" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}
          >
            Leads Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
            Your AVOMA prospects — businesses to sell AI receptionist services to
          </p>
        </div>
        <Link
          href="/admin/leads/new"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            boxShadow: "0 0 16px rgba(124,58,237,0.4)",
          }}
        >
          + Add Lead
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border p-5"
            style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
          >
            <p
              className="text-3xl font-black mb-1"
              style={{ fontFamily: "var(--font-orbitron)", color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6b6b80" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, email, phone…"
          className="flex-1 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "#0d0a1a",
            border: "1px solid rgba(168,85,247,0.2)",
            color: "#f3f0ff",
            outline: "none",
          }}
        />
        <select
          name="status"
          defaultValue={statusFilter}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "#0d0a1a",
            border: "1px solid rgba(168,85,247,0.2)",
            color: "#a78bfa",
            outline: "none",
          }}
        >
          <option value="">All Statuses</option>
          {Object.entries(statusLabel).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(168,85,247,0.3)" }}
        >
          Filter
        </button>
        {(q || statusFilter) && (
          <Link
            href="/admin/leads"
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: "#6b6b80", border: "1px solid rgba(168,85,247,0.15)" }}
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-x-auto"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
      >
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-sm" style={{ color: "#a78bfa" }}>
              {q || statusFilter ? "No leads match your filters." : "No leads yet. Add your first prospect."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                {["Business", "Contact", "Phone", "Industry", "Location", "Source", "ICP Score", "Status", "Added"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase whitespace-nowrap"
                    style={{ color: "#6b6b80" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const sc = statusColor[lead.status] ?? "#a78bfa";
                return (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "rgba(168,85,247,0.08)" }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold" style={{ color: "#f3f0ff" }}>
                        {lead.businessName ?? "—"}
                      </p>
                      {lead.contactEmail && (
                        <p className="text-xs" style={{ color: "#6b6b80" }}>{lead.contactEmail}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: "#a78bfa" }}>
                      {lead.contactName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#6b6b80" }}>
                      {lead.contactPhone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
                      {lead.industry ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
                      {lead.location ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
                      {lead.source ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#a78bfa" }}>
                      {lead.icpScore != null ? `${lead.icpScore}/10` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
                        style={{ background: `${sc}18`, color: sc }}
                      >
                        {statusLabel[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
                      {new Date(lead.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {leads.length > 0 && (
        <p className="text-xs mt-4 text-right" style={{ color: "#6b6b80" }}>
          Showing {leads.length} of {total} leads
        </p>
      )}
    </div>
  );
}

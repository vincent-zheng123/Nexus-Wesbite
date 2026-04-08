import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PLAN_LIMITS, billingMonthStart } from "@/lib/plan-limits";

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Lead",
  SUSPENDED: "Churned",
};

const statusColor: Record<string, string> = {
  ACTIVE: "#4ade80",
  INACTIVE: "#a78bfa",
  SUSPENDED: "#f87171",
};

const planColor: Record<string, string> = {
  STARTER: "#38bdf8",
  GROWTH: "#fbbf24",
  PRO: "#f97316",
  ENTERPRISE: "#a855f7",
};

export default async function ClientsCRMPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const q = searchParams.q?.toLowerCase() ?? "";
  const statusFilter = searchParams.status ?? "";

  const monthStart = billingMonthStart();

  const [allClients, usageRows] = await Promise.all([
    prisma.client.findMany({
      include: { config: true, _count: { select: { callLogs: true, appointments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.callLog.groupBy({
      by: ["clientId"],
      where: { createdAt: { gte: monthStart } },
      _sum: { durationSeconds: true },
    }),
  ]);

  const usageMap = new Map(
    usageRows.map((r) => [r.clientId, r._sum.durationSeconds ?? 0])
  );

  const clients = allClients.filter((c) => {
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesSearch = q
      ? c.businessName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
      : true;
    return matchesStatus && matchesSearch;
  });

  const total = allClients.length;
  const active = allClients.filter((c) => c.status === "ACTIVE").length;
  const leads = allClients.filter((c) => c.status === "INACTIVE").length;
  const churned = allClients.filter((c) => c.status === "SUSPENDED").length;

  const stats = [
    { label: "Total Clients", value: total, color: "#a855f7" },
    { label: "Active", value: active, color: "#4ade80" },
    { label: "Leads", value: leads, color: "#a78bfa" },
    { label: "Churned", value: churned, color: "#f87171" },
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
            Clients CRM
          </h1>
          <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
            Manage your pipeline and client relationships
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            boxShadow: "0 0 16px rgba(124,58,237,0.4)",
          }}
        >
          + Add Client
        </Link>
      </div>

      {/* Stats row */}
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
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Lead</option>
          <option value="SUSPENDED">Churned</option>
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
            href="/admin/clients"
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
        {clients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-sm" style={{ color: "#a78bfa" }}>
              {q || statusFilter ? "No clients match your filters." : "No clients yet. Add your first client to get started."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                {["Business", "Contact", "Phone", "Plan / Usage", "Status", "Calls", "Appts", "Since", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase"
                    style={{ color: "#6b6b80" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const sc = statusColor[client.status] ?? "#a78bfa";
                const pc = planColor[client.plan] ?? "#a78bfa";
                const usedSeconds = usageMap.get(client.id) ?? 0;
                const planKey = (client.plan ?? "STARTER") as keyof typeof PLAN_LIMITS;
                const limitSeconds = PLAN_LIMITS[planKey]?.seconds ?? PLAN_LIMITS.STARTER.seconds;
                const isUnlimited = !isFinite(limitSeconds);
                const pct = isUnlimited ? 0 : Math.min((usedSeconds / limitSeconds) * 100, 100);
                const usedHrs = (usedSeconds / 3600).toFixed(1);
                const limitHrs = isUnlimited ? null : (limitSeconds / 3600).toFixed(0);
                const barColor = pct >= 100 ? "#f87171" : pct >= 80 ? "#fbbf24" : pc;
                const capHit = client.config?.active === false && client.status === "ACTIVE";

                return (
                  <tr
                    key={client.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "rgba(168,85,247,0.08)" }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold" style={{ color: "#f3f0ff" }}>
                        {client.businessName}
                      </p>
                      <p className="text-xs" style={{ color: "#6b6b80" }}>
                        {client.industry ?? "—"} {client.location ? `· ${client.location}` : ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p style={{ color: "#a78bfa" }}>{client.contactName}</p>
                      <p className="text-xs" style={{ color: "#6b6b80" }}>
                        {client.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#6b6b80" }}>
                      {client.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3.5" style={{ minWidth: 160 }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${pc}18`, color: pc }}>
                          {client.plan}
                        </span>
                        {capHit && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                            CAP
                          </span>
                        )}
                      </div>
                      {isUnlimited ? (
                        <p className="text-xs" style={{ color: "#4ade80" }}>Unlimited</p>
                      ) : (
                        <>
                          <div className="w-full h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(168,85,247,0.12)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <p className="text-xs" style={{ color: "#6b6b80" }}>
                            {usedHrs} / {limitHrs} hrs ({pct.toFixed(0)}%)
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: `${sc}18`, color: sc }}
                      >
                        {statusLabel[client.status] ?? client.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#6b6b80" }}>
                      {client._count.callLogs}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "#6b6b80" }}>
                      {client._count.appointments}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
                      {new Date(client.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{
                          background: "rgba(124,58,237,0.15)",
                          color: "#a78bfa",
                          border: "1px solid rgba(168,85,247,0.2)",
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {clients.length > 0 && (
        <p className="text-xs mt-4 text-right" style={{ color: "#6b6b80" }}>
          Showing {clients.length} of {total} clients
        </p>
      )}
    </div>
  );
}

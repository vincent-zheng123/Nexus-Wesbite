import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AgentStatusCard from "@/components/dashboard/AgentStatusCard";
import { getEffectiveClientId } from "@/lib/getClientId";
import { GlowingEffect } from "@/components/ui/glowing-effect";

async function getStats(clientId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [callsToday, callsMonth, appointmentsPending, leadsWeek, followupsWeek, recentCalls, upcomingAppointments] =
    await Promise.all([
      prisma.callLog.count({ where: { clientId, timestamp: { gte: startOfDay } } }),
      prisma.callLog.count({ where: { clientId, timestamp: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { clientId, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] }, scheduledAt: { gte: now } } }),
      prisma.lead.count({ where: { clientId, createdAt: { gte: startOfWeek } } }),
      prisma.followup.count({ where: { clientId, createdAt: { gte: startOfWeek }, status: "SENT" } }),
      prisma.callLog.findMany({
        where: { clientId },
        orderBy: { timestamp: "desc" },
        take: 5,
      }),
      prisma.appointment.findMany({
        where: { clientId, scheduledAt: { gte: now }, status: { in: ["PENDING_CONFIRMATION", "CONFIRMED"] } },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      }),
    ]);

  return { callsToday, callsMonth, appointmentsPending, leadsWeek, followupsWeek, recentCalls, upcomingAppointments };
}

function outcomeLabel(outcome: string) {
  return outcome.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientId(user);
  if (!clientId) redirect("/admin");

  const stats = await getStats(clientId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const metrics = [
    { label: "Calls Today", value: stats.callsToday, sub: `${stats.callsMonth} this month`, color: "#a855f7" },
    { label: "Pending Appointments", value: stats.appointmentsPending, sub: "upcoming confirmed", color: "#e879f9" },
    { label: "New Leads (7d)", value: stats.leadsWeek, sub: "captured this week", color: "#7c3aed" },
    { label: "SMS Sent (7d)", value: stats.followupsWeek, sub: "follow-ups delivered", color: "#a78bfa" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>
          {greeting}, {user.name} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Agent status + Metric cards */}
      <div className="mb-4">
        <AgentStatusCard />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="relative rounded-2xl p-5 border"
            style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)", boxShadow: `0 0 20px ${m.color}18` }}
          >
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <p className="text-xs font-medium tracking-wide uppercase mb-3" style={{ color: "#a78bfa" }}>{m.label}</p>
            <p className="text-4xl font-black mb-1" style={{ fontFamily: "var(--font-orbitron)", background: `linear-gradient(135deg, ${m.color}, #e879f9)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {m.value}
            </p>
            <p className="text-xs" style={{ color: "#6b6b80" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent calls */}
        <div className="rounded-2xl p-6 border" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Recent Calls</h2>
            <a href="/calls" className="text-xs underline" style={{ color: "#a855f7" }}>View all</a>
          </div>
          {stats.recentCalls.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b6b80" }}>No calls yet — your AI receptionist is ready.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.1)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f3f0ff" }}>{call.callerPhone}</p>
                    <p className="text-xs" style={{ color: "#6b6b80" }}>{call.timestamp.toLocaleString()}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${outcomeColor(call.outcome)}18`, color: outcomeColor(call.outcome) }}>
                    {outcomeLabel(call.outcome)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="rounded-2xl p-6 border" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Upcoming Appointments</h2>
            <a href="/appointments" className="text-xs underline" style={{ color: "#a855f7" }}>View all</a>
          </div>
          {stats.upcomingAppointments.length === 0 ? (
            <p className="text-sm" style={{ color: "#6b6b80" }}>No upcoming appointments.</p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.1)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#f3f0ff" }}>{appt.callerName ?? appt.callerPhone}</p>
                    <p className="text-xs" style={{ color: "#6b6b80" }}>
                      {appt.scheduledAt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·{" "}
                      {appt.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>
                    {appt.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

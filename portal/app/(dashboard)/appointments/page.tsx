import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getEffectiveClientId } from "@/lib/getClientId";

const statusColor: Record<string, string> = {
  PENDING_CONFIRMATION: "#fbbf24",
  CONFIRMED: "#4ade80",
  COMPLETED: "#a78bfa",
  CANCELLED: "#f87171",
  NO_SHOW: "#f87171",
};

export default async function AppointmentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientId(user);
  if (!clientId) redirect("/admin");

  const [appointments, clientRow, configRow] = await Promise.all([
    prisma.appointment.findMany({
      where: { clientId },
      orderBy: { scheduledAt: "desc" },
      take: 50,
    }),
    prisma.client.findUnique({
      where: { id: clientId },
      select: { industry: true },
    }),
    prisma.clientConfig.findUnique({
      where: { clientId },
      select: { timezone: true },
    }),
  ]);
  const industry = clientRow?.industry ?? null;
  const tz = configRow?.timezone ?? "America/New_York";

  const upcoming = appointments.filter((a) => a.scheduledAt >= new Date() && ["PENDING_CONFIRMATION", "CONFIRMED"].includes(a.status));
  const past = appointments.filter((a) => !upcoming.includes(a));

  function AppointmentRow({ appt }: { appt: (typeof appointments)[0] }) {
    const color = statusColor[appt.status] ?? "#a78bfa";
    const typeLabel = appt.appointmentType
      ? appt.appointmentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";
    return (
      <tr className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
        <td className="px-5 py-3.5">
          <p className="font-medium" style={{ color: "#f3f0ff" }}>{appt.callerName ?? "—"}</p>
          <p className="text-xs" style={{ color: "#6b6b80" }}>{appt.callerPhone}</p>
        </td>
        <td className="px-5 py-3.5" style={{ color: "#a78bfa" }}>
          {appt.scheduledAt.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-5 py-3.5" style={{ color: "#a78bfa" }}>
          {appt.scheduledAt.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" })}
        </td>
        {industry && (
          <td className="px-5 py-3.5 text-xs" style={{ color: appt.appointmentType ? "#f3f0ff" : "#3a3a50" }}>
            {typeLabel}
          </td>
        )}
        <td className="px-5 py-3.5">
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${color}18`, color }}>
            {appt.status.replace(/_/g, " ").toLowerCase()}
          </span>
        </td>
        <td className="px-5 py-3.5 text-xs" style={{ color: "#6b6b80" }}>
          {appt.calendarType ?? "—"}
        </td>
      </tr>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Appointments</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>All appointments booked by your AI receptionist</p>
      </div>

      {/* Upcoming */}
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "#a78bfa" }}>
        Upcoming ({upcoming.length})
      </h2>
      <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        {upcoming.length === 0 ? (
          <p className="p-8 text-sm text-center" style={{ color: "#6b6b80" }}>No upcoming appointments.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                {["Client", "Date", "Time", ...(industry ? ["Type"] : []), "Status", "Calendar"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase" style={{ color: "#6b6b80" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* Past */}
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "#a78bfa" }}>
        Past ({past.length})
      </h2>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        {past.length === 0 ? (
          <p className="p-8 text-sm text-center" style={{ color: "#6b6b80" }}>No past appointments.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
                {["Client", "Date", "Time", ...(industry ? ["Type"] : []), "Status", "Calendar"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-medium tracking-wide uppercase" style={{ color: "#6b6b80" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {past.map((appt) => <AppointmentRow key={appt.id} appt={appt} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

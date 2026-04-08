"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NICHE_DISPLAY_CONFIG } from "@/lib/niches";

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

const outcomeColor: Record<string, string> = {
  APPOINTMENT_BOOKED: "#4ade80",
  NEW_LEAD: "#a78bfa",
  CALLBACK_REQUESTED: "#38bdf8",
  FAQ_HANDLED: "#60a5fa",
  NOT_INTERESTED: "#f87171",
  VOICEMAIL: "#fbbf24",
  NO_ANSWER: "#6b6b80",
  WRONG_NUMBER: "#f87171",
};

const apptColor: Record<string, string> = {
  CONFIRMED: "#4ade80",
  PENDING_CONFIRMATION: "#fbbf24",
  COMPLETED: "#60a5fa",
  CANCELLED: "#f87171",
  NO_SHOW: "#f97316",
};

type Client = {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string | null;
  industry: string | null;
  location: string | null;
  plan: string;
  status: string;
  createdAt: string;
  config: { vapiPhoneNumber: string; active: boolean; calendarType: string | null; calendarId: string | null; calendarRefreshToken: string | null } | null;
  callLogs: {
    id: string;
    callerName: string | null;
    callerPhone: string;
    outcome: string;
    durationSeconds: number | null;
    timestamp: string;
    qualificationData: Record<string, unknown> | null;
  }[];
  appointments: {
    id: string;
    callerName: string | null;
    callerPhone: string;
    scheduledAt: string;
    status: string;
  }[];
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState("");
  const [calConnected, setCalConnected] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [usage, setUsage] = useState<{ usedSeconds: number; limitSeconds: number | null; plan: string } | null>(null);
  const [overageLoading, setOverageLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/clients/${id}/detail`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setClient(data);
          setCalConnected(!!data.config?.calendarRefreshToken);
          setCalendarId(data.config?.calendarId ?? "");
        }
      })
      .catch(() => setError("Failed to load client."))
      .finally(() => setLoading(false));

    fetch(`/api/admin/clients/${id}/usage`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setUsage(data); })
      .catch(() => {});
  }, [id]);

  async function approveOverage() {
    setOverageLoading(true);
    await fetch(`/api/admin/clients/${id}/approve-overage`, { method: "POST" });
    // Refresh client + usage
    const [clientRes, usageRes] = await Promise.all([
      fetch(`/api/admin/clients/${id}/detail`).then((r) => r.json()),
      fetch(`/api/admin/clients/${id}/usage`).then((r) => r.json()),
    ]);
    if (!clientRes.error) setClient(clientRes);
    if (!usageRes.error) setUsage(usageRes);
    setOverageLoading(false);
  }

  async function updateStatus(status: string) {
    if (!client) return;
    setStatusUpdating(true);
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setClient((prev) => prev ? { ...prev, status } : prev);
    }
    setStatusUpdating(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p style={{ color: "#a78bfa" }}>Loading…</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8">
        <p style={{ color: "#f87171" }}>{error || "Client not found."}</p>
        <Link href="/admin/clients" className="text-sm mt-4 inline-block" style={{ color: "#a78bfa" }}>
          ← Back to Clients
        </Link>
      </div>
    );
  }

  const sc = statusColor[client.status] ?? "#a78bfa";
  const nicheFields = client.industry ? (NICHE_DISPLAY_CONFIG[client.industry] ?? []) : [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/clients"
        className="text-sm mb-6 inline-flex items-center gap-1"
        style={{ color: "#a78bfa" }}
      >
        ← Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 mt-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}
          >
            {client.businessName}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${sc}18`, color: sc }}
            >
              {statusLabel[client.status] ?? client.status}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}
            >
              {client.plan}
            </span>
            {client.config?.vapiPhoneNumber && (
              <span className="text-xs font-mono" style={{ color: "#6b6b80" }}>
                AI: {client.config.vapiPhoneNumber}
              </span>
            )}
          </div>
        </div>

        {/* Status changer */}
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#6b6b80" }}>Pipeline status:</span>
          <select
            value={client.status}
            disabled={statusUpdating}
            onChange={(e) => updateStatus(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{
              background: "#0d0a1a",
              border: "1px solid rgba(168,85,247,0.3)",
              color: sc,
              outline: "none",
              cursor: statusUpdating ? "not-allowed" : "pointer",
            }}
          >
            <option value="INACTIVE">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Churned</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {/* Contact card */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
        >
          <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#6b6b80" }}>
            Contact Info
          </h2>
          <div className="space-y-3">
            {[
              { label: "Name", value: client.contactName },
              { label: "Email", value: client.email },
              { label: "Phone", value: client.phone ?? "—" },
              { label: "Industry", value: client.industry ?? "—" },
              { label: "Location", value: client.location ?? "—" },
              {
                label: "Client since",
                value: new Date(client.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs" style={{ color: "#6b6b80" }}>{label}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "#f3f0ff" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: calConnected ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.2)" }}>
          <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "#6b6b80" }}>Google Calendar</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: calConnected ? "#4ade80" : "#f87171" }} />
              <span className="text-sm font-medium" style={{ color: calConnected ? "#4ade80" : "#f87171" }}>
                {calConnected ? "Connected" : "Not Connected"}
              </span>
            </div>
            {calConnected && calendarId && (
              <div>
                <p className="text-xs" style={{ color: "#6b6b80" }}>Calendar</p>
                <p className="text-sm font-mono mt-0.5 truncate" style={{ color: "#a78bfa" }}>{calendarId}</p>
              </div>
            )}
            <p className="text-xs leading-relaxed" style={{ color: "#6b6b80" }}>
              {calConnected
                ? "AI can book appointments directly into this calendar on calls."
                : "Connect calendar so the AI can book appointments automatically on calls."}
            </p>
            <a
              href={"/api/admin/clients/" + id + "/google-calendar/connect"}
              className="block text-xs font-semibold px-3 py-2 rounded-lg text-center"
              style={{ background: calConnected ? "rgba(74,222,128,0.08)" : "rgba(96,165,250,0.18)", color: calConnected ? "#4ade80" : "#60a5fa", border: "1px solid " + (calConnected ? "rgba(74,222,128,0.25)" : "rgba(96,165,250,0.25)") }}
            >
              {calConnected ? "Reconnect Calendar" : "Connect Google Calendar"}
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="col-span-2 grid grid-cols-2 gap-4 content-start">
          {[
            { label: "Total Calls", value: client.callLogs.length, color: "#a855f7" },
            { label: "Appointments", value: client.appointments.length, color: "#4ade80" },
            {
              label: "Booked from Calls",
              value: client.callLogs.filter((c) => c.outcome === "APPOINTMENT_BOOKED").length,
              color: "#38bdf8",
            },
            {
              label: "Upcoming Appts",
              value: client.appointments.filter(
                (a) => a.status === "CONFIRMED" || a.status === "PENDING_CONFIRMATION"
              ).length,
              color: "#fbbf24",
            },
          ].map((s) => (
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
              <p className="text-xs uppercase tracking-wider" style={{ color: "#6b6b80" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Usage Bar */}
      {usage && (
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{
            background: "#0d0a1a",
            borderColor: client.config?.active === false && client.status === "ACTIVE"
              ? "rgba(248,113,113,0.35)"
              : "rgba(168,85,247,0.18)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#a78bfa" }}>
                Monthly Usage · {usage.plan}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>
                Resets 1st of each month · Billing period is calendar month UTC
              </p>
            </div>
            {client.config?.active === false && client.status === "ACTIVE" && (
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                  style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)" }}
                >
                  Cap Reached · Calls routing to fallback
                </span>
                <button
                  onClick={approveOverage}
                  disabled={overageLoading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
                  style={{
                    background: overageLoading ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.12)",
                    borderColor: "rgba(168,85,247,0.4)",
                    color: "#f3f0ff",
                    cursor: overageLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {overageLoading ? "Enabling…" : "Approve Overage"}
                </button>
              </div>
            )}
          </div>

          {usage.limitSeconds !== null ? (() => {
            const pct = Math.min((usage.usedSeconds / usage.limitSeconds) * 100, 100);
            const usedHrs = (usage.usedSeconds / 3600).toFixed(1);
            const limitHrs = (usage.limitSeconds / 3600).toFixed(0);
            const barColor = pct >= 100 ? "#f87171" : pct >= 80 ? "#fbbf24" : "#a855f7";
            return (
              <div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: "#6b6b80" }}>
                  <span>{usedHrs} hrs used</span>
                  <span>{limitHrs} hrs limit · {pct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(168,85,247,0.12)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })() : (
            <p className="text-sm font-semibold" style={{ color: "#4ade80" }}>Unlimited — Enterprise plan</p>
          )}
        </div>
      )}

      {/* Call History */}
      <div
        className="rounded-2xl border overflow-hidden mb-6"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>
            Call History
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>Last {Math.min(client.callLogs.length, 20)} calls</p>
        </div>
        {client.callLogs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "#6b6b80" }}>No calls recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.1)" }}>
                {["Caller", "Phone", "Outcome", "Duration", "Date", ...nicheFields.map((f) => f.label)].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "#6b6b80" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.callLogs.slice(0, 20).map((call) => {
                const oc = outcomeColor[call.outcome] ?? "#a78bfa";
                return (
                  <tr key={call.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.06)" }}>
                    <td className="px-5 py-3" style={{ color: "#f3f0ff" }}>{call.callerName ?? "Unknown"}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "#6b6b80" }}>{call.callerPhone}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${oc}18`, color: oc }}
                      >
                        {call.outcome.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#6b6b80" }}>
                      {call.durationSeconds != null ? `${call.durationSeconds}s` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#6b6b80" }}>
                      {new Date(call.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    {nicheFields.map((field) => {
                      const raw = call.qualificationData?.[field.key] ?? null;
                      const display = field.render(raw);
                      return (
                        <td key={field.key} className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: raw != null ? "#f3f0ff" : "#3a3a50" }}>
                          {display}
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

      {/* Appointments */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>
            Appointments
          </h2>
        </div>
        {client.appointments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "#6b6b80" }}>No appointments yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(168,85,247,0.1)" }}>
                {["Caller", "Phone", "Scheduled", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wide"
                    style={{ color: "#6b6b80" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.appointments.map((appt) => {
                const ac = apptColor[appt.status] ?? "#a78bfa";
                return (
                  <tr key={appt.id} className="border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.06)" }}>
                    <td className="px-5 py-3" style={{ color: "#f3f0ff" }}>{appt.callerName ?? "Unknown"}</td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: "#6b6b80" }}>{appt.callerPhone}</td>
                    <td className="px-5 py-3 text-xs" style={{ color: "#a78bfa" }}>
                      {new Date(appt.scheduledAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: `${ac}18`, color: ac }}
                      >
                        {appt.status.replace(/_/g, " ")}
                      </span>
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

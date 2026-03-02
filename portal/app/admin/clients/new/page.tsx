"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    const res = await fetch("/api/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to create client.");
      return;
    }

    setSuccess("Client created. AI assistant setup is running in the background.");
    setTimeout(() => router.push("/admin"), 2000);
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#06040f",
    border: "1px solid rgba(168,85,247,0.2)",
    color: "#f3f0ff",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "#a78bfa",
    marginBottom: "6px",
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Onboard New Client</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>Creates client record, AI config, and portal login credentials. Vapi assistant is auto-provisioned if an industry is selected.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business info */}
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Business Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Business Name *</label>
              <input name="businessName" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Name *</label>
              <input name="contactName" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input name="email" type="email" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input name="phone" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Industry / Niche</label>
              <select name="industry" style={{ ...inputStyle }}>
                <option value="">— Select niche (optional) —</option>
                <option value="DENTAL">Dental</option>
                <option value="ROOFING">Roofing</option>
                <option value="HVAC">HVAC</option>
              </select>
              <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>
                Selecting a niche auto-provisions the Vapi assistant with niche-specific intel prompts and structured data schema.
              </p>
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input name="location" placeholder="City, State" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Plan</label>
              <select name="plan" style={{ ...inputStyle }}>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Receptionist config */}
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>AI Receptionist Config</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Vapi Phone Number *</label>
              <input name="vapiPhoneNumber" required placeholder="+1xxxxxxxxxx" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vapi Assistant ID</label>
              <input name="vapiAssistantId" placeholder="Leave blank to auto-provision" style={inputStyle} />
              <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Auto-provisioned when industry is selected.</p>
            </div>
            <div>
              <label style={labelStyle}>Calendar Type</label>
              <select name="calendarType" style={{ ...inputStyle }}>
                <option value="google">Google Calendar</option>
                <option value="calendly">Calendly</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Calendar ID</label>
              <input name="calendarId" placeholder="primary or Calendly event slug" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Business Hours Start</label>
              <input name="businessHoursStart" defaultValue="09:00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Business Hours End</label>
              <input name="businessHoursEnd" defaultValue="17:00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Timezone</label>
              <input name="timezone" defaultValue="America/New_York" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Twilio From Number</label>
              <input name="twilioFromNumber" placeholder="+1xxxxxxxxxx" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>SMS Follow-up Template</label>
              <textarea
                name="followupSmsTemplate"
                rows={2}
                placeholder="Hi {caller_name}, thanks for calling {business_name}! …"
                style={{ ...inputStyle }}
              />
            </div>
          </div>
        </div>

        {/* Portal login */}
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Portal Login Credentials</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Username *</label>
              <input name="username" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Temporary Password *</label>
              <input name="password" type="password" required minLength={8} style={inputStyle} />
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "#6b6b80" }}>Share these credentials with the client.</p>
        </div>

        {error && (
          <p className="text-sm py-3 px-4 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm py-3 px-4 rounded-xl" style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
            {success}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#a78bfa", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating client…" : "Onboard Client"}
          </button>
        </div>
      </form>
    </div>
  );
}

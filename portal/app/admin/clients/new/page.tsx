"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type NicheTemplate = {
  slug: string;
  displayName: string;
};

type NicheField = {
  key: string;
  label: string;
  type: string;
};

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templates, setTemplates] = useState<NicheTemplate[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [nicheFields, setNicheFields] = useState<NicheField[]>([]);

  useEffect(() => {
    fetch("/api/admin/business-types")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch(() => {});
  }, []);

  async function handleIndustryChange(slug: string) {
    setSelectedSlug(slug);
    setNicheFields([]);
    if (!slug) return;
    try {
      const res = await fetch(`/api/admin/business-types?slug=${slug}`);
      const data = await res.json();
      if (data?.fieldDefinitions) {
        setNicheFields(data.fieldDefinitions as NicheField[]);
      }
    } catch {
      // niche field preview is non-critical
    }
  }

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

    setSuccess("Client created. AI receptionist setup is running — phone numbers and portal credentials will be provisioned automatically and emailed to the client.");
    setTimeout(() => router.push("/admin"), 3000);
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
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>Fill in business details. The workflow will automatically purchase phone numbers, provision the AI assistant, and email the client their portal credentials.</p>
      </div>

      {/* Auto-provision notice */}
      <div className="rounded-xl px-4 py-3 mb-6 flex gap-3 items-start" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
        <span style={{ color: "#a78bfa", fontSize: "16px", lineHeight: "20px" }}>⚡</span>
        <p className="text-xs leading-relaxed" style={{ color: "#c4b5fd" }}>
          <strong style={{ color: "#e9d5ff" }}>Fully automated:</strong> After you submit, n8n will purchase a dedicated Vapi call number, build the AI receptionist with niche-specific prompts, purchase a Twilio SMS number, and email the client their dashboard login. No manual steps needed.
        </p>
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
            <div className="col-span-2">
              <label style={labelStyle}>Business Address</label>
              <input name="businessAddress" placeholder="123 Main St, Austin, TX 78701" style={inputStyle} />
              <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Told to callers who ask for your location.</p>
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
              <label style={labelStyle}>Business Phone</label>
              <input name="phone" type="tel" placeholder="+12125551234" style={inputStyle} />
              <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Used to determine area code for phone number purchase.</p>
            </div>
            <div>
              <label style={labelStyle}>Monthly Revenue</label>
              <input name="monthlyRevenue" placeholder="e.g. $12,000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Industry / Niche *</label>
              <select
                name="industry"
                required
                value={selectedSlug}
                onChange={(e) => handleIndustryChange(e.target.value)}
                style={{ ...inputStyle }}
              >
                <option value="">— Select niche —</option>
                {templates.length > 0
                  ? templates.map((t) => (
                      <option key={t.slug} value={t.slug}>{t.displayName}</option>
                    ))
                  : (
                    <>
                      <option value="DENTAL">Dental Practice</option>
                      <option value="ROOFING">Roofing Contractor</option>
                      <option value="HVAC">HVAC Service</option>
                    </>
                  )}
              </select>
              <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>
                Determines niche-specific intel prompts and data capture schema.
              </p>
              {nicheFields.length > 0 && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "#a78bfa" }}>
                    The AI will collect during calls:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {nicheFields.map((f) => (
                      <span
                        key={f.key}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(168,85,247,0.12)", color: "#c4b5fd" }}
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
{/* AI Receptionist */}
<div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
  <h2 className="font-semibold mb-1" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>AI Receptionist</h2>
  <p className="text-xs mb-4" style={{ color: "#6b6b80" }}>Name, persona, and call behavior. Used directly in the Vapi system prompt.</p>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label style={labelStyle}>Receptionist Name *</label>
      <input name="aiName" required placeholder="e.g. Alex, Jordan, Sam" style={inputStyle} />
      <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>The name the AI introduces itself as on calls.</p>
    </div>
    <div>
      <label style={labelStyle}>Gender</label>
      <select name="aiGender" style={{ ...inputStyle }}>
        <option value="neutral">Neutral</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
      </select>
      <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Influences pronoun use and Vapi voice selection.</p>
    </div>
    <div className="col-span-2">
      <label style={labelStyle}>Opening Line (First Message)</label>
      <input
        name="firstMessage"
        defaultValue="Thank you for calling, this is {{AI_NAME}}. How can I help you today?"
        style={inputStyle}
      />
      <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Exact first words spoken when a call connects. Sent to Vapi separately from the system prompt.</p>
    </div>
    <div className="col-span-2">
      <label style={labelStyle}>After-Hours / Emergency Phone *</label>
      <input name="emergencyPhone" required type="tel" placeholder="+12125551234" style={inputStyle} />
      <p className="text-xs mt-1" style={{ color: "#6b6b80" }}>Human-answered line. The AI gives this number to callers when the office is closed.</p>
    </div>
  </div>
</div>

        {/* Scheduling config */}
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <h2 className="font-semibold mb-1" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Scheduling Config</h2>
          <p className="text-xs mb-4" style={{ color: "#6b6b80" }}>Connect Google Calendar OAuth after onboarding. Paste the Calendar ID below if you have it now.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={labelStyle}>Google Calendar ID</label>
              <input name="calendarId" placeholder="primary or email@gmail.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Business Hours Start</label>
              <input name="businessHoursStart" defaultValue="09:00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Business Hours End</label>
              <input name="businessHoursEnd" defaultValue="17:00" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle}>Timezone</label>
              <input name="timezone" defaultValue="America/New_York" style={inputStyle} />
            </div>
          </div>
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
            {loading ? "Creating client…" : "Onboard Client →"}
          </button>
        </div>
      </form>
    </div>
  );
}

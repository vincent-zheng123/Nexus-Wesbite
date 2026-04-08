"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface ImportResult {
  totalRows: number;
  inserted: number;
  skipped: number;
  errors: string[];
}

export default function LeadsImportPage() {
  const [clientId, setClientId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId.trim()) { setError("Client ID is required."); return; }
    if (!file) { setError("Please select a CSV file."); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/admin/leads/import?clientId=${encodeURIComponent(clientId.trim())}`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Import failed.");
    } else {
      setResult(json);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href="/admin/leads"
          className="text-xs"
          style={{ color: "#a78bfa" }}
        >
          ← Back to Leads
        </Link>
      </div>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}
        >
          Import Past Leads
        </h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>
          Upload a CSV to bulk-import past clients or contacts into the CRM.
        </p>
      </div>

      {/* Format guide */}
      <div
        className="rounded-xl p-4 mb-6 text-xs"
        style={{ background: "#0d0a1a", border: "1px solid rgba(168,85,247,0.18)", color: "#c4b5fd" }}
      >
        <p className="font-semibold mb-2" style={{ color: "#f3f0ff" }}>Accepted CSV columns</p>
        <table className="w-full">
          <thead>
            <tr style={{ color: "#6b6b80" }}>
              <th className="text-left pb-1">Column name(s)</th>
              <th className="text-left pb-1">Required</th>
            </tr>
          </thead>
          <tbody className="leading-6">
            {[
              ["name / contactName / fullName", "At least one of name or phone"],
              ["phone / contactPhone / mobile", "At least one of name or phone"],
              ["email / contactEmail", "Optional"],
              ["business / businessName / company", "Optional"],
              ["location / city", "Optional"],
              ["industry", "Optional"],
              ["source", "Optional (defaults to csv_import)"],
            ].map(([col, req]) => (
              <tr key={col}>
                <td className="pr-4 font-mono" style={{ color: "#e9d5ff" }}>{col}</td>
                <td style={{ color: req.startsWith("At least") ? "#fbbf24" : "#6b6b80" }}>{req}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3" style={{ color: "#6b6b80" }}>
          Duplicate contacts (matched by phone + client) are automatically skipped.
          US phone numbers in any format are accepted and normalized to E.164.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-6 space-y-5"
        style={{ background: "#0d0a1a", border: "1px solid rgba(168,85,247,0.18)" }}
      >
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#a78bfa" }}>
            Client ID
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="cuid from clients table"
            className="w-full rounded-lg px-3 py-2 text-sm font-mono"
            style={{
              background: "#100d20",
              border: "1px solid rgba(168,85,247,0.25)",
              color: "#f3f0ff",
              outline: "none",
            }}
          />
          <p className="mt-1 text-xs" style={{ color: "#6b6b80" }}>
            Find this in Admin → Clients → click a client → copy the ID from the URL.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#a78bfa" }}>
            CSV File
          </label>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
            style={{ color: "#f3f0ff" }}
          />
        </div>

        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#2a0a0a", color: "#f87171" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
          style={{
            background: loading ? "rgba(168,85,247,0.3)" : "#a855f7",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Importing…" : "Import Leads"}
        </button>
      </form>

      {result && (
        <div
          className="mt-6 rounded-2xl p-5"
          style={{ background: "#0d0a1a", border: "1px solid rgba(74,222,128,0.2)" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "#4ade80" }}>
            Import complete
          </p>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            {[
              { label: "Total rows", value: result.totalRows },
              { label: "Inserted", value: result.inserted, color: "#4ade80" },
              { label: "Skipped", value: result.skipped, color: "#fbbf24" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-3"
                style={{ background: "#100d20" }}
              >
                <p className="text-xl font-bold" style={{ color: color ?? "#f3f0ff" }}>
                  {value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6b6b80" }}>{label}</p>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "#f87171" }}>
                Row errors ({result.errors.length})
              </p>
              <ul className="text-xs space-y-1" style={{ color: "#f87171" }}>
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

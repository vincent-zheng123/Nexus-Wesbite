"use client";

import { useRouter } from "next/navigation";

interface Props {
  clients: { id: string; businessName: string }[];
  currentClientId: string;
}

export default function AdminPreviewBanner({ clients, currentClientId }: Props) {
  const router = useRouter();

  function handleSwitch(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    document.cookie = `avoma_preview_client=${id}; path=/; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 flex-shrink-0"
      style={{
        background: "rgba(251,191,36,0.07)",
        borderBottom: "1px solid rgba(251,191,36,0.22)",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#fbbf24", fontFamily: "var(--font-space-grotesk)" }}>
          Admin Preview
        </span>
        <span className="text-xs hidden sm:inline" style={{ color: "rgba(251,191,36,0.6)" }}>
          · You are viewing a client&apos;s dashboard. Changes affect the live system.
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs" style={{ color: "rgba(251,191,36,0.7)" }}>Viewing:</span>
        <select
          value={currentClientId}
          onChange={handleSwitch}
          className="text-xs font-semibold rounded-lg px-2.5 py-1 border outline-none cursor-pointer"
          style={{
            background: "rgba(251,191,36,0.1)",
            borderColor: "rgba(251,191,36,0.3)",
            color: "#fbbf24",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id} style={{ background: "#0d0a1a", color: "#f3f0ff" }}>
              {c.businessName}
            </option>
          ))}
        </select>
        <a
          href="/admin"
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors"
          style={{
            color: "#fbbf24",
            borderColor: "rgba(251,191,36,0.3)",
            background: "rgba(251,191,36,0.08)",
            textDecoration: "none",
          }}
        >
          ← Admin
        </a>
      </div>
    </div>
  );
}

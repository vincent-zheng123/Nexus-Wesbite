"use client";

import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "⬡" },
  { label: "Calls", href: "/calls", icon: "📞" },
  { label: "Appointments", href: "/appointments", icon: "📅" },
  { label: "Leads", href: "/leads", icon: "🎯" },
  { label: "Reports", href: "/reports", icon: "📊" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
];

export default function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const user = session.user;
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col sticky top-0 h-screen border-r"
      style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.15)" }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="url(#sl)" strokeWidth="2" />
            <circle cx="20" cy="20" r="4" fill="#a855f7" />
            <ellipse cx="20" cy="20" rx="13" ry="5" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3 2" />
            <defs>
              <linearGradient id="sl" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#e879f9" />
              </linearGradient>
            </defs>
          </svg>
          <span
            className="text-lg font-black tracking-widest"
            style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(135deg, #a855f7, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            NEXUS
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b mx-3 mt-3 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#f3f0ff", fontFamily: "var(--font-space-grotesk)" }}>
              {user.name}
            </p>
            <p className="text-xs truncate" style={{ color: "#a78bfa" }}>
              {user.role === "ADMIN" ? "Administrator" : "Client"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#f3f0ff" : "#a78bfa",
                border: active ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {user.role === "ADMIN" && (
          <>
            <Link
              href="/admin/clients"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: pathname.startsWith("/admin/clients") ? "rgba(124,58,237,0.2)" : "transparent",
                color: pathname.startsWith("/admin/clients") ? "#f3f0ff" : "#a78bfa",
                border: pathname.startsWith("/admin/clients") ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              <span className="text-base leading-none">👥</span>
              Clients
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: pathname === "/admin" ? "rgba(124,58,237,0.2)" : "transparent",
                color: pathname === "/admin" ? "#f3f0ff" : "#a78bfa",
                border: pathname === "/admin" ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              <span className="text-base leading-none">🛡️</span>
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t pt-3" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: "#f87171" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span className="text-base leading-none">→</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

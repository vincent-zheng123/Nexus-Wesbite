"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  office: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      <circle cx="18" cy="7" r="2.5" fill="currentColor" opacity=".4"/>
    </svg>
  ),
  calls: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.6 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.53 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.07-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  appointments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  leads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  integrations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

type IconKey = keyof typeof icons;

const navItems: { label: string; href: string; icon: IconKey }[] = [
  { label: "Overview",      href: "/dashboard",    icon: "overview"      },
  { label: "Virtual Office",href: "/office",       icon: "office"        },
  { label: "Activity Log",  href: "/activity",     icon: "activity"      },
  { label: "Appointments",  href: "/appointments", icon: "appointments"  },
  { label: "Calendar",      href: "/calendar",     icon: "appointments"  },
  { label: "Clients",       href: "/leads",        icon: "leads"         },
  { label: "Settings",      href: "/settings",     icon: "settings"      },
];

// Shared inner content — used by both the mobile drawer and the desktop aside
function SidebarInner({
  user,
  initials,
  pathname,
  isPreviewMode,
  previewClientName,
  onLinkClick,
}: {
  user: { name?: string | null; role?: string };
  initials: string;
  pathname: string;
  isPreviewMode?: boolean;
  previewClientName?: string | null;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onLinkClick}>
          <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="nxsl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#e879f9"/>
              </linearGradient>
            </defs>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#nxsl)" strokeWidth="1.6" fill="none"/>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#nxsl)" strokeWidth="1.6" fill="none" transform="rotate(60 26 26)" opacity=".75"/>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="#e879f9" strokeWidth="1.6" fill="none" transform="rotate(-60 26 26)" opacity=".6"/>
            <circle cx="26" cy="26" r="6" fill="url(#nxsl)"/>
            <circle cx="26" cy="26" r="3" fill="#fff" opacity=".35"/>
          </svg>
          <span
            className="text-lg font-black"
            style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "-0.04em", background: "linear-gradient(135deg, #f3f0ff 0%, #a78bfa 60%, #e879f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            AVOMA
          </span>
        </Link>
      </div>

      {/* User card */}
      <div className="px-4 py-4 mx-3 mt-3 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: isPreviewMode && previewClientName ? "linear-gradient(135deg, #b45309, #d97706)" : "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff" }}
          >
            {isPreviewMode && previewClientName ? previewClientName.charAt(0).toUpperCase() : initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#f3f0ff", fontFamily: "var(--font-space-grotesk)" }}>
              {isPreviewMode && previewClientName ? previewClientName : user.name}
            </p>
            <p className="text-xs truncate" style={{ color: isPreviewMode && previewClientName ? "#fbbf24" : "#a78bfa" }}>
              {isPreviewMode && previewClientName ? "Preview Mode" : user.role === "ADMIN" ? "Administrator" : "Client"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Client dashboard pages — hidden for admin unless in preview mode */}
        {(user.role !== "ADMIN" || isPreviewMode) && navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "rgba(124,58,237,0.2)" : "transparent",
                color: active ? "#f3f0ff" : "#a78bfa",
                border: active ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
              }}
            >
              <span className="flex-shrink-0" style={{ width: 17, height: 17, color: active ? "#a855f7" : "currentColor" }}>
                {icons[item.icon]}
              </span>
              {item.label}
            </Link>
          );
        })}

        {user.role === "ADMIN" && (
          <Link
            href="/admin/clients"
            onClick={onLinkClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: pathname.startsWith("/admin") ? "rgba(124,58,237,0.2)" : "transparent",
              color: pathname.startsWith("/admin") ? "#f3f0ff" : "#a78bfa",
              border: pathname.startsWith("/admin") ? "1px solid rgba(168,85,247,0.3)" : "1px solid transparent",
            }}
          >
            <span className="flex-shrink-0" style={{ width: 17, height: 17 }}>{icons.admin}</span>
            Admin
          </Link>
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
          <svg className="flex-shrink-0" style={{ width: 17, height: 17 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );
}

export default function Sidebar({ session, isPreviewMode, previewClientName }: { session: Session; isPreviewMode?: boolean; previewClientName?: string | null }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = session.user as { name?: string | null; role?: string };
  const initials = (user.name ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ── Mobile top bar (hidden on md+) ── */}
      <div
        className="flex md:hidden items-center justify-between px-4 py-3 sticky top-0 z-40 border-b"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.15)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="nxsl-mob" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7c3aed"/>
                <stop offset="100%" stopColor="#e879f9"/>
              </linearGradient>
            </defs>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#nxsl-mob)" strokeWidth="1.6" fill="none"/>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#nxsl-mob)" strokeWidth="1.6" fill="none" transform="rotate(60 26 26)" opacity=".75"/>
            <ellipse cx="26" cy="26" rx="21" ry="7" stroke="#e879f9" strokeWidth="1.6" fill="none" transform="rotate(-60 26 26)" opacity=".6"/>
            <circle cx="26" cy="26" r="6" fill="url(#nxsl-mob)"/>
            <circle cx="26" cy="26" r="3" fill="#fff" opacity=".35"/>
          </svg>
          <span
            className="text-base font-black"
            style={{ fontFamily: "var(--font-orbitron)", letterSpacing: "-0.04em", background: "linear-gradient(135deg, #f3f0ff 0%, #a78bfa 60%, #e879f9 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            AVOMA
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg"
          style={{ color: "#a78bfa" }}
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Mobile overlay drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <aside
            className="relative w-72 flex flex-col h-full border-r overflow-y-auto"
            style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.15)" }}
          >
            {/* Close button */}
            <div className="flex justify-end px-4 py-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg"
                style={{ color: "#a78bfa" }}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <SidebarInner
              user={user}
              initials={initials}
              pathname={pathname}
              isPreviewMode={isPreviewMode}
              previewClientName={previewClientName}
              onLinkClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex w-64 flex-shrink-0 flex-col sticky top-0 h-screen border-r"
        style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.15)" }}
      >
        <SidebarInner user={user} initials={initials} pathname={pathname} isPreviewMode={isPreviewMode} previewClientName={previewClientName} />
      </aside>
    </>
  );
}

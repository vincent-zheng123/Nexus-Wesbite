"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeroShutterText from "@/components/ui/hero-shutter-text";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid username or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#06040f" }}>

      {/* Left — shutter animation panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative" style={{ borderRight: "1px solid rgba(168,85,247,0.12)" }}>
        <HeroShutterText text="AVOMA" className="w-full h-full" />
      </div>

      {/* Right — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 relative">
        {/* Background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none lg:left-1/2">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-80 sm:h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 sm:w-72 sm:h-72 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #e879f9, transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo (shown on mobile only — desktop shows the animation panel) */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center gap-3 mb-2">
              <svg width="36" height="36" viewBox="0 0 52 52" fill="none">
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7c3aed"/><stop offset="1" stopColor="#e879f9"/></linearGradient>
                  <linearGradient id="lg2" x1="1" y1="0" x2="0" y2="1"><stop stopColor="#a855f7"/><stop offset="1" stopColor="#7c3aed"/></linearGradient>
                  <filter id="lglow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <g filter="url(#lglow)">
                  <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#lg1)" strokeWidth="1.6" fill="none"/>
                  <ellipse cx="26" cy="26" rx="21" ry="7" stroke="url(#lg2)" strokeWidth="1.6" fill="none" transform="rotate(60 26 26)" opacity={0.75}/>
                  <ellipse cx="26" cy="26" rx="21" ry="7" stroke="#e879f9" strokeWidth="1.6" fill="none" transform="rotate(-60 26 26)" opacity={0.6}/>
                  <circle cx="5" cy="26" r="2.2" fill="#a855f7" opacity={0.85}/>
                  <circle cx="47" cy="26" r="2.2" fill="#a855f7" opacity={0.85}/>
                  <circle cx="26" cy="26" r="6" fill="url(#lg1)"/>
                  <circle cx="26" cy="26" r="3" fill="#fff" opacity={0.35}/>
                </g>
              </svg>
              <span className="text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(135deg, #a855f7, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                AVOMA
              </span>
            </div>
            <p className="text-sm" style={{ color: "#a78bfa" }}>Client Portal</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Client Portal</h2>
            <p className="text-sm" style={{ color: "#a78bfa" }}>Sign in to access your AI receptionist dashboard</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-5 sm:p-8 border" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)", boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
            <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>Sign in</h1>
            <p className="text-sm mb-6" style={{ color: "#a78bfa" }}>Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: "#a78bfa" }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "#06040f", border: "1px solid rgba(168,85,247,0.2)", color: "#f3f0ff", transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.2)")}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium tracking-wide uppercase" style={{ color: "#a78bfa" }}>
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs" style={{ color: "#a855f7" }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ background: "#06040f", border: "1px solid rgba(168,85,247,0.2)", color: "#f3f0ff", transition: "border-color 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.2)")}
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide"
                style={{
                  background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 0 20px rgba(124,58,237,0.4)",
                  transition: "box-shadow 0.2s, background 0.2s",
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "#6b6b80" }}>
            Don&apos;t have access?{" "}
            <a href="https://callavoma.com/#contact" className="underline" style={{ color: "#a855f7" }}>
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

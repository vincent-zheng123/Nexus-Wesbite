"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#06040f" }}>
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #e879f9, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" stroke="url(#lg)" strokeWidth="2" />
              <circle cx="20" cy="20" r="4" fill="#a855f7" />
              <ellipse cx="20" cy="20" rx="13" ry="5" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3 2" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#7c3aed" />
                  <stop offset="1" stopColor="#e879f9" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-2xl font-black tracking-widest" style={{ fontFamily: "var(--font-orbitron)", background: "linear-gradient(135deg, #a855f7, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NEXUS
            </span>
          </div>
          <p className="text-sm" style={{ color: "#a78bfa" }}>Client Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.2)", boxShadow: "0 0 40px rgba(124,58,237,0.15)" }}>
          <h1 className="text-xl font-semibold mb-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>Sign in</h1>
          <p className="text-sm mb-6" style={{ color: "#a78bfa" }}>Enter your credentials to access your dashboard</p>

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
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "#06040f", border: "1px solid rgba(168,85,247,0.2)", color: "#f3f0ff" }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(168,85,247,0.2)")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 tracking-wide uppercase" style={{ color: "#a78bfa" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "#06040f", border: "1px solid rgba(168,85,247,0.2)", color: "#f3f0ff" }}
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
              className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all"
              style={{
                background: loading ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 0 20px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#6b6b80" }}>
          Don&apos;t have access?{" "}
          <a href="https://vincentbuildsai.cloud/#contact" className="underline" style={{ color: "#a855f7" }}>
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}

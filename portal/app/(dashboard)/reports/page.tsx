import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>Performance analytics — coming in Phase 2</p>
      </div>
      <div className="rounded-2xl border p-12 text-center" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <p className="text-5xl mb-4">📊</p>
        <p className="text-sm mb-2 font-medium" style={{ color: "#f3f0ff" }}>Charts & Reports Coming Soon</p>
        <p className="text-xs" style={{ color: "#6b6b80" }}>Daily and weekly performance reports with conversion rates and call volume trends.</p>
      </div>
    </div>
  );
}

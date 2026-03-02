import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { client: { include: { config: true } } },
  });

  if (!dbUser?.client) redirect("/admin");
  const { client } = dbUser;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "#a78bfa" }}>Your business profile and AI receptionist configuration</p>
      </div>

      {/* Business info */}
      <div className="rounded-2xl border p-6 mb-5" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
        <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>Business Info</h2>
        <div className="space-y-3 text-sm">
          {[
            ["Business Name", client.businessName],
            ["Contact Name", client.contactName],
            ["Email", client.email],
            ["Phone", client.phone ?? "—"],
            ["Industry", client.industry ?? "—"],
            ["Location", client.location ?? "—"],
            ["Plan", client.plan],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
              <span style={{ color: "#a78bfa" }}>{label}</span>
              <span className="font-medium" style={{ color: "#f3f0ff" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI config */}
      {client.config && (
        <div className="rounded-2xl border p-6" style={{ background: "#0d0a1a", borderColor: "rgba(168,85,247,0.18)" }}>
          <h2 className="font-semibold mb-4" style={{ fontFamily: "var(--font-space-grotesk)", color: "#f3f0ff" }}>AI Receptionist Config</h2>
          <div className="space-y-3 text-sm">
            {[
              ["Phone Number", client.config.vapiPhoneNumber],
              ["Business Hours", `${client.config.businessHoursStart} – ${client.config.businessHoursEnd}`],
              ["Timezone", client.config.timezone],
              ["Calendar Type", client.config.calendarType],
              ["Status", client.config.active ? "Active" : "Paused"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b last:border-0" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
                <span style={{ color: "#a78bfa" }}>{label}</span>
                <span className="font-medium" style={{ color: "#f3f0ff" }}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: "#6b6b80" }}>
            To change your AI configuration, contact your Nexus account manager.
          </p>
        </div>
      )}
    </div>
  );
}

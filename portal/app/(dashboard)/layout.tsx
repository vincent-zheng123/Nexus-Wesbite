import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import AdminPreviewBanner from "@/components/dashboard/AdminPreviewBanner";
import { getEffectiveClientId } from "@/lib/getClientId";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  // Read admin preview cookie to know which client is being previewed
  const previewId = isAdmin
    ? (await cookies()).get("avoma_preview_client")?.value ?? null
    : null;

  const effectiveClientId = await getEffectiveClientId(session.user, previewId);

  // Admin with no preview client selected → send them to their admin home
  if (isAdmin && !effectiveClientId) redirect("/admin");

  // Fetch all clients for the admin switcher dropdown
  let allClients: { id: string; businessName: string }[] = [];
  if (isAdmin) {
    allClients = await prisma.client.findMany({
      orderBy: { businessName: "asc" },
      select: { id: true, businessName: true },
    });
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: "#06040f" }}>
      <Sidebar
        session={session}
        isPreviewMode={isAdmin}
        previewClientName={isAdmin ? (allClients.find((c) => c.id === effectiveClientId)?.businessName ?? null) : null}
      />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto h-full flex flex-col">
        {isAdmin && effectiveClientId && allClients.length > 0 && (
          <AdminPreviewBanner
            clients={allClients}
            currentClientId={effectiveClientId}
          />
        )}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: "#06040f" }}>
      <Sidebar session={session} />
      <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}

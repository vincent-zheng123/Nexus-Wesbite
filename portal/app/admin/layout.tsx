import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "#06040f" }}>
      <Sidebar session={session} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

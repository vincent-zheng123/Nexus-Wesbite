import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import VirtualOfficeClient from "@/components/dashboard/VirtualOfficeClient";
import { getEffectiveClientIdFromRequest } from "@/lib/getClientId";

export default async function OfficePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;
  const clientId = await getEffectiveClientIdFromRequest(user);
  if (!clientId) redirect("/admin");

  const [callsTotal, appointmentsTotal, followupsTotal, config, recentCalls] = await Promise.all([
    prisma.callLog.count({ where: { clientId } }),
    prisma.appointment.count({ where: { clientId } }),
    prisma.followup.count({ where: { clientId } }),
    prisma.clientConfig.findUnique({ where: { clientId } }),
    prisma.callLog.findMany({
      where: { clientId },
      orderBy: { timestamp: "desc" },
      take: 6,
      select: { callerPhone: true, outcome: true, timestamp: true },
    }),
  ]);

  const agentName = config?.vapiAssistantId
    ? `Avoma-${clientId.slice(-4).toUpperCase()}`
    : user.name ?? "Avoma Agent";

  return (
    <VirtualOfficeClient
      agentName={agentName}
      vapiPhoneNumber={config?.vapiPhoneNumber ?? null}
      callsTotal={callsTotal}
      appointmentsTotal={appointmentsTotal}
      followupsTotal={followupsTotal}
      recentCalls={recentCalls.map((c) => ({
        callerPhone: c.callerPhone,
        outcome: c.outcome,
        timestamp: c.timestamp,
      }))}
    />
  );
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { billingMonthStart, planLimitSeconds } from "@/lib/plan-limits";

/**
 * GET /api/admin/clients/[id]/usage
 *
 * Returns monthly hour usage for a client.
 * Admin only.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { plan: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const monthStart = billingMonthStart();

  const agg = await prisma.callLog.aggregate({
    where: { clientId: params.id, createdAt: { gte: monthStart } },
    _sum: { durationSeconds: true },
  });

  const usedSeconds = agg._sum.durationSeconds ?? 0;
  const limit = planLimitSeconds(client.plan);

  return NextResponse.json({
    usedSeconds,
    limitSeconds: limit === Infinity ? null : limit,
    plan: client.plan,
    monthStart: monthStart.toISOString(),
  });
}

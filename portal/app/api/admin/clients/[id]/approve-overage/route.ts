import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { relinkVapiPhone } from "@/lib/vapi-client";

/**
 * POST /api/admin/clients/[id]/approve-overage
 *
 * Admin approves a mid-month overage for a capped client:
 * - Sets planCapOverride = true (enforcement skipped for rest of month)
 * - Sets active = true
 * - Re-links the Vapi phone number to the assistant
 * - Logs an AutomationRun record
 *
 * Overage billing is handled manually by admin outside this system.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.clientConfig.findUnique({
    where: { clientId: params.id },
  });
  if (!config) {
    return NextResponse.json({ error: "Client config not found" }, { status: 404 });
  }

  // Re-enable in DB
  await prisma.clientConfig.update({
    where: { clientId: params.id },
    data: { active: true, planCapOverride: true },
  });

  let vapiError: string | null = null;

  // Re-link Vapi phone
  if (config.vapiPhoneNumberId && config.vapiAssistantId) {
    try {
      await relinkVapiPhone(config.vapiPhoneNumberId, config.vapiAssistantId);
    } catch (err) {
      vapiError = err instanceof Error ? err.message : String(err);
    }
  } else {
    vapiError = "vapiPhoneNumberId or vapiAssistantId not set — manual re-link required";
  }

  await prisma.automationRun.create({
    data: {
      workflowName: "overage-approved",
      clientId: params.id,
      status: vapiError ? "completed_with_warnings" : "completed",
      startedAt: new Date(),
      completedAt: new Date(),
      errorMessage: vapiError,
    },
  });

  return NextResponse.json({ success: true, vapiError });
}

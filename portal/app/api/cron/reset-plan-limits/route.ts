import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { relinkVapiPhone } from "@/lib/vapi-client";

/**
 * POST /api/cron/reset-plan-limits
 *
 * Called by n8n on the 1st of each month (cron: 0 0 1 * *).
 * Re-enables all clients that were auto-disabled due to plan cap.
 *
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 *
 * n8n setup:
 *   Trigger: Schedule (0 0 1 * *)
 *   Node: HTTP Request
 *     Method: POST
 *     URL: https://app.vincentbuildsai.cloud/api/cron/reset-plan-limits
 *     Header: x-cron-secret: {{ $env.CRON_SECRET }}
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find clients that are ACTIVE in status but have their config disabled
  // (plan cap hit). Clients with status SUSPENDED are intentionally disabled —
  // skip them.
  const disabledConfigs = await prisma.clientConfig.findMany({
    where: {
      active: false,
      client: { status: "ACTIVE" },
    },
    include: { client: { select: { id: true, businessName: true } } },
  });

  let resetCount = 0;
  const errors: string[] = [];

  for (const config of disabledConfigs) {
    try {
      // Re-enable in DB and clear any overage override
      await prisma.clientConfig.update({
        where: { id: config.id },
        data: { active: true, planCapOverride: false },
      });

      // Re-link Vapi phone to assistant
      if (config.vapiPhoneNumberId && config.vapiAssistantId) {
        await relinkVapiPhone(config.vapiPhoneNumberId, config.vapiAssistantId);
      } else {
        errors.push(
          `${config.client.businessName}: vapiPhoneNumberId or vapiAssistantId missing — manual re-link needed`
        );
      }

      await prisma.automationRun.create({
        data: {
          workflowName: "plan-monthly-reset",
          clientId: config.clientId,
          status: "completed",
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      resetCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${config.client.businessName}: ${msg}`);

      await prisma.automationRun.create({
        data: {
          workflowName: "plan-monthly-reset",
          clientId: config.clientId,
          status: "failed",
          startedAt: new Date(),
          completedAt: new Date(),
          errorMessage: msg,
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ reset: resetCount, errors });
}

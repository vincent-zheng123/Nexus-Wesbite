import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVapiAssistant } from "@/lib/vapi-client";
import { NICHE_INTEL_FIELDS } from "@/lib/niches";

/**
 * POST /api/admin/clients/[id]/provision
 *
 * Creates a Vapi assistant for the given client using their niche config.
 * Saves the returned assistantId to ClientConfig.vapiAssistantId.
 * Also saves the niche schema snapshot to ClientConfig.nicheConfig.
 *
 * Requires: ADMIN role, client must exist, industry must be set.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Allow internal calls from n8n using a shared secret (bypasses NextAuth session)
  const internalSecret = req.headers.get("x-internal-secret");
  const validSecret = process.env.INTERNAL_API_SECRET;
  const isInternalCall = validSecret && internalSecret === validSecret;

  if (!isInternalCall) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const clientId = params.id;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { config: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.config) {
    return NextResponse.json(
      { error: "Client has no config record. Create the client first." },
      { status: 400 }
    );
  }

  if (!client.industry) {
    return NextResponse.json(
      { error: "Client has no industry type set. Set it before provisioning." },
      { status: 400 }
    );
  }

  const industryType = client.industry as string;

  // N8N tools webhook URL — read from env, fall back to placeholder
  const toolsWebhookUrl =
    process.env.N8N_TOOLS_WEBHOOK_URL ??
    "https://your-n8n-instance.com/webhook/vapi-tools";

  const assistant = await createVapiAssistant({
    businessName: client.businessName,
    industryType,
    businessHoursStart: client.config.businessHoursStart,
    businessHoursEnd: client.config.businessHoursEnd,
    timezone: client.config.timezone,
    toolsWebhookUrl,
  });

  // Save assistant ID + niche config snapshot
  await prisma.clientConfig.update({
    where: { clientId },
    data: {
      vapiAssistantId: assistant.id,
      nicheConfig: {
        industryType,
        fields: (NICHE_INTEL_FIELDS[industryType] ?? []).map((f) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          description: f.description,
        })),
        provisionedAt: new Date().toISOString(),
        assistantName: assistant.name,
      },
    },
  });

  return NextResponse.json({
    success: true,
    assistantId: assistant.id,
    assistantName: assistant.name,
    industryType,
    provisionedAt: new Date().toISOString(),
  });
}

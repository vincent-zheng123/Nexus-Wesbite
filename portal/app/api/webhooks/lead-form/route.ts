import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/lead-form
 *
 * Receives contact form submissions from client websites.
 * Creates a lead record and queues an outbound Vapi call via n8n.
 *
 * Body: {
 *   clientId: string,       // or vapiPhoneNumber to resolve clientId
 *   name: string,
 *   phone: string,
 *   email?: string,
 *   message?: string,
 *   source?: string,        // e.g. "website_contact_form"
 * }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { clientId, vapiPhoneNumber, name, phone, email, source } = body;

  // Validate phone (minimum required to make an outbound call)
  if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 });

  // Resolve clientId
  let resolvedClientId = clientId;
  if (!resolvedClientId && vapiPhoneNumber) {
    const config = await prisma.clientConfig.findUnique({ where: { vapiPhoneNumber } });
    resolvedClientId = config?.clientId;
  }

  if (!resolvedClientId) {
    return NextResponse.json({ error: "Could not resolve client" }, { status: 400 });
  }

  // Verify client exists and is active
  const client = await prisma.client.findUnique({
    where: { id: resolvedClientId },
    include: { config: true },
  });

  if (!client || client.status !== "ACTIVE" || !client.config?.active) {
    return NextResponse.json({ error: "Client not found or inactive" }, { status: 404 });
  }

  // Create or update lead
  const existingLead = await prisma.lead.findFirst({
    where: { clientId: resolvedClientId, contactPhone: phone },
  });

  let lead;
  if (existingLead) {
    lead = await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        contactName: name || existingLead.contactName,
        contactEmail: email || existingLead.contactEmail,
        status: "NEW",
      },
    });
  } else {
    lead = await prisma.lead.create({
      data: {
        clientId: resolvedClientId,
        contactName: name || null,
        contactPhone: phone,
        contactEmail: email || null,
        source: source || "website_contact_form",
        status: "NEW",
      },
    });
  }

  // Queue a scheduled followup for n8n to pick up (3 min delay)
  const scheduledAt = new Date(Date.now() + 3 * 60 * 1000);
  await prisma.scheduledFollowup.create({
    data: {
      leadId: lead.id,
      clientId: resolvedClientId,
      attemptNumber: 1,
      scheduledAt,
      status: "pending",
    },
  });

  return NextResponse.json({ received: true, leadId: lead.id, scheduledAt }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/nexus-intake
 *
 * Receives submissions from the NEXUS website start.html intake form.
 * Stores the lead in Supabase and triggers the n8n nexus-sales-callback
 * workflow which fires Axel (outbound Vapi sales agent) after 3 minutes.
 *
 * Body: {
 *   first_name: string,
 *   last_name: string,
 *   email: string,
 *   phone: string,
 *   business_name: string,
 *   industry: string,
 *   location?: string,
 *   monthly_volume?: string,
 *   service_type?: string,
 *   notes?: string,
 * }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    business_name,
    industry,
    location,
    monthly_volume,
    service_type,
    notes,
  } = body;

  if (!first_name || !email || !phone || !business_name || !industry) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Normalize phone to E.164
  const rawPhone = String(phone).replace(/\D/g, "");
  let normalizedPhone = rawPhone;
  if (rawPhone.length === 10) normalizedPhone = `+1${rawPhone}`;
  else if (rawPhone.length === 11 && rawPhone.startsWith("1")) normalizedPhone = `+${rawPhone}`;
  else if (!normalizedPhone.startsWith("+")) normalizedPhone = `+${normalizedPhone}`;

  const isValidPhone = /^\+1\d{10}$/.test(normalizedPhone);
  if (!isValidPhone) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const contactName = [first_name, last_name].filter(Boolean).join(" ");

  // Store lead — clientId is null for NEXUS's own intake leads
  await prisma.lead.create({
    data: {
      clientId: null,
      contactName,
      contactEmail: email,
      contactPhone: normalizedPhone,
      businessName: business_name,
      industry,
      location: location ?? null,
      source: "nexus_website",
      qualificationData: {
        monthly_volume: monthly_volume ?? null,
        service_type: service_type ?? null,
        notes: notes ?? null,
      },
    },
  });

  // Fire n8n nexus-sales-callback workflow (non-blocking)
  const n8nWebhookUrl = process.env.N8N_NEXUS_SALES_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        phone: normalizedPhone,
        business_name,
        industry,
        location: location ?? "",
        monthly_volume: monthly_volume ?? "",
        service_type: service_type ?? "",
        notes: notes ?? "",
      }),
    }).catch(() => {
      // Non-blocking — log failure silently, lead is already stored
    });
  }

  return NextResponse.json({ received: true }, { status: 201 });
}

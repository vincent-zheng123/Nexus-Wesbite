import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { IndustryType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const {
    businessName, contactName, email, phone, industry, location, plan,
    vapiPhoneNumber, vapiAssistantId, calendarType, calendarId,
    businessHoursStart, businessHoursEnd, timezone,
    twilioFromNumber, followupSmsTemplate,
    username, password,
  } = body;

  // Validate required fields — vapiAssistantId is optional (can be provisioned after)
  if (!businessName || !contactName || !email || !vapiPhoneNumber || !username || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  // Validate industryType if provided
  const validIndustries = Object.values(IndustryType);
  if (industry && !validIndustries.includes(industry as IndustryType)) {
    return NextResponse.json(
      { error: `Invalid industry. Must be one of: ${validIndustries.join(", ")}` },
      { status: 400 }
    );
  }

  // Check uniqueness
  const [existingEmail, existingPhone, existingUsername] = await Promise.all([
    prisma.client.findUnique({ where: { email } }),
    prisma.clientConfig.findUnique({ where: { vapiPhoneNumber } }),
    prisma.user.findUnique({ where: { username } }),
  ]);

  if (existingEmail) return NextResponse.json({ error: "A client with that email already exists." }, { status: 409 });
  if (existingPhone) return NextResponse.json({ error: "That Vapi phone number is already assigned." }, { status: 409 });
  if (existingUsername) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  // Create client + config + user in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        businessName,
        contactName,
        email,
        phone: phone || null,
        industry: (industry as IndustryType) || null,
        location: location || null,
        plan: plan || "STARTER",
        status: "ACTIVE",
      },
    });

    await tx.clientConfig.create({
      data: {
        clientId: client.id,
        vapiPhoneNumber,
        vapiAssistantId: vapiAssistantId || null,
        calendarType: calendarType || "google",
        calendarId: calendarId || null,
        businessHoursStart: businessHoursStart || "09:00",
        businessHoursEnd: businessHoursEnd || "17:00",
        timezone: timezone || "America/New_York",
        twilioFromNumber: twilioFromNumber || null,
        followupSmsTemplate: followupSmsTemplate || null,
        active: true,
      },
    });

    const portalUser = await tx.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: "CLIENT",
        clientId: client.id,
      },
    });

    return { clientId: client.id, userId: portalUser.id };
  });

  // Fire n8n admin-client-setup webhook — non-blocking, portal does not wait
  const n8nWebhookUrl = process.env.N8N_ADMIN_SETUP_WEBHOOK_URL;
  if (n8nWebhookUrl) {
    fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: result.clientId }),
    }).catch(() => {}); // intentionally fire-and-forget
  }

  return NextResponse.json({ success: true, ...result }, { status: 201 });
}

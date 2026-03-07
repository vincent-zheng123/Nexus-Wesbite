import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: { clientId: null as any },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { businessName, contactName, contactEmail, contactPhone, industry, location, source, icpScore } = body;

  if (!businessName) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  const lead = await prisma.lead.create({
    data: {
      clientId: null,
      businessName,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      industry: industry || null,
      location: location || null,
      source: source || "Manual",
      icpScore: icpScore ? parseInt(icpScore) : null,
      status: "NEW",
      dateScraped: new Date(),
    },
  });

  return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
}

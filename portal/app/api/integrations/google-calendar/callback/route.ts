import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const base = process.env.NEXTAUTH_URL ?? "https://app.callavoma.com";

  if (error || !code || !state) {
    return NextResponse.redirect(`${base}/integrations?gcal=error`);
  }

  let clientId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    clientId = decoded.clientId;
    if (!clientId) throw new Error("missing clientId");
  } catch {
    return NextResponse.redirect(`${base}/integrations?gcal=error`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokens.refresh_token || !tokens.access_token) {
    return NextResponse.redirect(`${base}/integrations?gcal=error`);
  }

  // Resolve the primary calendar ID (user's email address)
  let calendarId = "primary";
  try {
    const calRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList/primary", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const calData = await calRes.json();
    if (calData.id) calendarId = calData.id;
  } catch {
    // fall back to "primary"
  }

  await prisma.clientConfig.upsert({
    where: { clientId },
    update: {
      calendarType: "google",
      calendarId,
      calendarRefreshToken: tokens.refresh_token,
      calendarAccessToken: tokens.access_token,
      calendarTokenExpiry: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
    },
    create: {
      clientId,
      calendarType: "google",
      calendarId,
      calendarRefreshToken: tokens.refresh_token,
      calendarAccessToken: tokens.access_token,
      calendarTokenExpiry: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
    },
  });

  return NextResponse.redirect(`${base}/integrations?gcal=success`);
}

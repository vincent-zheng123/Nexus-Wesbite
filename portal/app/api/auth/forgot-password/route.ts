import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success — don't reveal whether the email exists
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Create a new token valid for 1 hour
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return NextResponse.json({ error: "Email service not configured." }, { status: 500 });
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AVOMA <noreply@callavoma.com>",
      to: [user.email],
      subject: "Reset your AVOMA portal password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #06040f; color: #f3f0ff; border-radius: 16px;">
          <h2 style="margin: 0 0 8px; font-size: 22px; color: #f3f0ff;">Reset your password</h2>
          <p style="color: #a78bfa; margin: 0 0 24px; font-size: 14px;">
            We received a request to reset the password for your AVOMA portal account.
            This link expires in <strong style="color:#f3f0ff">1 hour</strong>.
          </p>
          <a
            href="${resetUrl}"
            style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;"
          >
            Reset Password
          </a>
          <p style="color: #6b6b80; font-size: 12px; margin: 24px 0 0;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
          <p style="color: #6b6b80; font-size: 11px; margin: 8px 0 0;">
            Or copy this link: ${resetUrl}
          </p>
        </div>
      `,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

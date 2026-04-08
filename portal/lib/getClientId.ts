import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Returns the effective clientId for the given user.
 * - CLIENT role: returns their own clientId (or null if unlinked).
 * - ADMIN role: returns previewClientId if provided and valid, otherwise the
 *   first available client's id so admins can preview dashboard pages.
 */
export const getEffectiveClientId = cache(async function getEffectiveClientId(
  user: { role?: string; clientId?: string },
  previewClientId?: string | null
): Promise<string | null> {
  if (user.clientId) return user.clientId;
  if (user.role === "ADMIN") {
    if (previewClientId) {
      const exists = await prisma.client.findUnique({
        where: { id: previewClientId },
        select: { id: true },
      });
      if (exists) return exists.id;
    }
    const first = await prisma.client.findFirst({ orderBy: { createdAt: "asc" } });
    return first?.id ?? null;
  }
  return null;
});

/**
 * Server-side helper that reads the admin preview cookie and resolves the
 * effective clientId. Use this in dashboard page.tsx files instead of
 * calling getEffectiveClientId(user) directly so the admin client switcher works.
 */
export async function getEffectiveClientIdFromRequest(
  user: { role?: string; clientId?: string }
): Promise<string | null> {
  const previewId =
    user.role === "ADMIN"
      ? (await cookies()).get("avoma_preview_client")?.value ?? null
      : null;
  return getEffectiveClientId(user, previewId);
}

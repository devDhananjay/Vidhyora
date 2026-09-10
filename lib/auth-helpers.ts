import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { isPlatformAdmin, isSuperAdmin } from "@/lib/roles";

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Authentication required");
  }
  return session;
}

export async function requireAuthOrRedirect(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    const params = callbackUrl
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
    redirect(`/login${params}`);
  }
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}

export async function requireSeller() {
  return requireRole("SELLER", "SUPER_ADMIN", "ADMIN");
}

/** ADMIN or SUPER_ADMIN — general admin dashboard ops. */
export async function requireAdmin() {
  const session = await requireAuth();
  if (!isPlatformAdmin(session.user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}

/** SUPER_ADMIN only — site settings, mega menu, homepage, blog CMS. */
export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (!isSuperAdmin(session.user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }
  return session;
}

export async function requireSellerProfile() {
  const session = await requireSeller();
  const { default: prisma } = await import("@/lib/prisma");
  const profile = await prisma.sellerProfile.findUnique({
    where: { sellerId: session.user.id },
  });
  if (!profile && !isPlatformAdmin(session.user.role)) {
    throw new AuthError("Seller profile not found", 403);
  }
  return { session, profile };
}

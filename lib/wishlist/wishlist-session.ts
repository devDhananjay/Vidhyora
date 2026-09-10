import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GUEST_WISHLIST_COOKIE = "vidyora-guest-wishlist";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type WishlistSession = {
  wishlistId: string;
  userId: string | null;
  guestToken: string | null;
};

/** Read guest wishlist cookie (safe in RSC — does not set). */
export async function getGuestWishlistToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_WISHLIST_COOKIE)?.value ?? null;
}

/** Create / refresh guest wishlist cookie (Server Actions / Route Handlers only). */
export async function ensureGuestWishlistToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_WISHLIST_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  store.set(GUEST_WISHLIST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export async function clearGuestWishlistToken() {
  const store = await cookies();
  store.delete(GUEST_WISHLIST_COOKIE);
}

/**
 * Get existing wishlist or create one for the current user / guest.
 * Must be called from a Server Action (may set cookie).
 */
export async function getOrCreateWishlistSession(): Promise<WishlistSession> {
  const session = await auth();

  if (session?.user?.id) {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: session.user.id },
        select: { id: true },
      });
    }
    return {
      wishlistId: wishlist.id,
      userId: session.user.id,
      guestToken: null,
    };
  }

  const guestToken = await ensureGuestWishlistToken();
  let wishlist = await prisma.wishlist.findUnique({
    where: { guestToken },
    select: { id: true },
  });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { guestToken },
      select: { id: true },
    });
  }
  return { wishlistId: wishlist.id, userId: null, guestToken };
}

/** Load wishlist id for reads without creating a guest cookie. */
export async function getWishlistSessionId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return wishlist?.id ?? null;
  }

  const guestToken = await getGuestWishlistToken();
  if (!guestToken) return null;
  const wishlist = await prisma.wishlist.findUnique({
    where: { guestToken },
    select: { id: true },
  });
  return wishlist?.id ?? null;
}

/**
 * After login: merge guest wishlist items into the user wishlist.
 */
export async function mergeGuestWishlistIntoUser(userId: string): Promise<void> {
  const token = await getGuestWishlistToken();
  if (!token) return;

  const guestWishlist = await prisma.wishlist.findUnique({
    where: { guestToken: token },
    include: { items: true },
  });

  if (!guestWishlist) {
    await clearGuestWishlistToken();
    return;
  }

  if (guestWishlist.items.length === 0) {
    await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
    await clearGuestWishlistToken();
    return;
  }

  let userWishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });

  if (!userWishlist) {
    await prisma.wishlist.update({
      where: { id: guestWishlist.id },
      data: { userId, guestToken: null },
    });
    await clearGuestWishlistToken();
    return;
  }

  for (const item of guestWishlist.items) {
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: userWishlist.id,
        productId: item.productId,
      },
    });
    if (existing) continue;
    await prisma.wishlistItem.create({
      data: {
        wishlistId: userWishlist.id,
        productId: item.productId,
        variantId: item.variantId,
      },
    });
  }

  await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
  await clearGuestWishlistToken();
}

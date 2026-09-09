import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const GUEST_CART_COOKIE = "vidyora-guest-cart";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartSession = {
  cartId: string;
  userId: string | null;
  guestToken: string | null;
};

/** Read guest cart cookie (safe in RSC — does not set). */
export async function getGuestCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_CART_COOKIE)?.value ?? null;
}

/** Create / refresh guest cart cookie (Server Actions / Route Handlers only). */
export async function ensureGuestCartToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  store.set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export async function clearGuestCartToken() {
  const store = await cookies();
  store.delete(GUEST_CART_COOKIE);
}

/**
 * Get existing cart or create one for the current user / guest.
 * Must be called from a Server Action (may set cookie).
 */
export async function getOrCreateCartSession(): Promise<CartSession> {
  const session = await auth();

  if (session?.user?.id) {
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
        select: { id: true },
      });
    }
    return { cartId: cart.id, userId: session.user.id, guestToken: null };
  }

  const guestToken = await ensureGuestCartToken();
  let cart = await prisma.cart.findUnique({
    where: { guestToken },
    select: { id: true },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { guestToken },
      select: { id: true },
    });
  }
  return { cartId: cart.id, userId: null, guestToken };
}

/** Whether a cart row belongs to the current session owner. */
export function ownsCart(
  cart: { userId: string | null; guestToken: string | null },
  owner: { userId: string | null; guestToken: string | null },
): boolean {
  if (owner.userId) return cart.userId === owner.userId;
  return Boolean(owner.guestToken && cart.guestToken === owner.guestToken);
}

/**
 * After login: merge guest cart items into the user cart, then drop guest cart + cookie.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const token = await getGuestCartToken();
  if (!token) return;

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken: token },
    include: { items: true },
  });

  if (!guestCart) {
    await clearGuestCartToken();
    return;
  }

  if (guestCart.items.length === 0) {
    await prisma.cart.delete({ where: { id: guestCart.id } });
    await clearGuestCartToken();
    return;
  }

  let userCart = await prisma.cart.findUnique({
    where: { userId },
  });

  // No user cart yet — just attach the guest cart to the user
  if (!userCart) {
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId, guestToken: null },
    });
    await clearGuestCartToken();
    return;
  }

  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: userCart.id,
          variantId: item.variantId,
        },
      },
      include: { variant: true },
    });

    if (existing) {
      const available =
        existing.variant.stock - existing.variant.reservedStock;
      const mergedQty = existing.quantity + item.quantity;
      const quantity =
        available > 0 ? Math.min(mergedQty, available) : existing.quantity;

      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity,
          // If either side wanted it in active cart, keep it active
          savedForLater: existing.savedForLater && item.savedForLater,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          savedForLater: item.savedForLater,
        },
      });
    }
  }

  if (!userCart.couponCode && guestCart.couponCode) {
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { couponCode: guestCart.couponCode },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
  await clearGuestCartToken();
}

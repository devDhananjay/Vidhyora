"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getGuestCartToken } from "@/lib/cart/cart-session";
import type { CartWithItems } from "@/types/cart";

const cartInclude = {
  items: {
    include: {
      product: true,
      variant: true,
    },
    orderBy: { createdAt: "desc" as const },
  },
};

/** Load cart for signed-in user or guest (cookie). Does not create a cart. */
export async function getCart(): Promise<CartWithItems | null> {
  try {
    const session = await auth();

    if (session?.user?.id) {
      return prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: cartInclude,
      });
    }

    const guestToken = await getGuestCartToken();
    if (!guestToken) return null;

    return prisma.cart.findUnique({
      where: { guestToken },
      include: cartInclude,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return null;
  }
}

export type CartPlpLine = {
  cartItemId: string;
  productId: string;
  variantId: string;
  quantity: number;
  availableStock: number;
};

async function resolveCartId() {
  const session = await auth();
  if (session?.user?.id) {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    return cart?.id ?? null;
  }
  const guestToken = await getGuestCartToken();
  if (!guestToken) return null;
  const cart = await prisma.cart.findUnique({
    where: { guestToken },
    select: { id: true },
  });
  return cart?.id ?? null;
}

/** Compact cart lines for PLP quick-add / qty steppers. */
export async function getCartLinesForPlp(): Promise<CartPlpLine[]> {
  try {
    const cartId = await resolveCartId();
    if (!cartId) return [];

    const items = await prisma.cartItem.findMany({
      where: { cartId, savedForLater: false },
      select: {
        id: true,
        productId: true,
        variantId: true,
        quantity: true,
        variant: {
          select: { stock: true, reservedStock: true },
        },
      },
    });

    return items.map((item) => ({
      cartItemId: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      availableStock: Math.max(
        0,
        item.variant.stock - item.variant.reservedStock,
      ),
    }));
  } catch (error) {
    console.error("Get cart lines for PLP error:", error);
    return [];
  }
}

/** @deprecated Prefer getCartLinesForPlp — kept for simple membership checks. */
export async function getCartProductIds(): Promise<string[]> {
  const lines = await getCartLinesForPlp();
  return [...new Set(lines.map((line) => line.productId))];
}

export async function getCartVariantIds(): Promise<string[]> {
  const lines = await getCartLinesForPlp();
  return lines.map((line) => line.variantId);
}

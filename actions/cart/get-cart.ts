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

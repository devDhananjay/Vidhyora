"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { CartWithItems } from "@/types/cart";

export async function getCart(): Promise<CartWithItems | null> {
  try {
    const session = await requireAuth();

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return cart;
  } catch (error) {
    console.error("Get cart error:", error);
    return null;
  }
}

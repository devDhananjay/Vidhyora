"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  getOrCreateCartSession,
  ownsCart,
} from "@/lib/cart/cart-session";
import { removeCartItemSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function removeCartItem(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const owner = await getOrCreateCartSession();

    const rawData = {
      cartItemId: formData.get("cartItemId"),
    };

    const validatedData = removeCartItemSchema.parse(rawData);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: { cart: true },
    });

    if (!cartItem || !ownsCart(cartItem.cart, owner)) {
      return { success: false, error: "Cart item not found" };
    }

    await prisma.cartItem.delete({
      where: { id: validatedData.cartItemId },
    });

    revalidatePath("/cart");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Remove cart item error:", error);
    return { success: false, error: "Failed to remove cart item" };
  }
}

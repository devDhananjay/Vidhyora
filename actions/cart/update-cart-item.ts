"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  getOrCreateCartSession,
  ownsCart,
} from "@/lib/cart/cart-session";
import { updateCartItemSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function updateCartItemQuantity(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const owner = await getOrCreateCartSession();

    const rawData = {
      cartItemId: formData.get("cartItemId"),
      quantity: parseInt(formData.get("quantity") as string),
    };

    const validatedData = updateCartItemSchema.parse(rawData);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: {
        cart: true,
        variant: true,
      },
    });

    if (!cartItem || !ownsCart(cartItem.cart, owner)) {
      return { success: false, error: "Cart item not found" };
    }

    const availableStock =
      cartItem.variant.stock - cartItem.variant.reservedStock;
    if (availableStock < validatedData.quantity) {
      return {
        success: false,
        error: `Only ${availableStock} items available in stock`,
      };
    }

    await prisma.cartItem.update({
      where: { id: validatedData.cartItemId },
      data: { quantity: validatedData.quantity },
    });

    revalidatePath("/cart");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update cart item error:", error);
    return { success: false, error: "Failed to update cart item" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { updateCartItemSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function updateCartItemQuantity(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const rawData = {
      cartItemId: formData.get("cartItemId"),
      quantity: parseInt(formData.get("quantity") as string),
    };

    const validatedData = updateCartItemSchema.parse(rawData);

    // Get cart item with variant stock info
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: {
        cart: true,
        variant: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    // Check stock availability
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

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Update cart item error:", error);
    return {
      success: false,
      error: "Failed to update cart item",
    };
  }
}

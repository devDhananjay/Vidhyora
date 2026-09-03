"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { saveForLaterSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function toggleSaveForLater(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const rawData = {
      cartItemId: formData.get("cartItemId"),
      savedForLater: formData.get("savedForLater") === "true",
    };

    const validatedData = saveForLaterSchema.parse(rawData);

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    await prisma.cartItem.update({
      where: { id: validatedData.cartItemId },
      data: { savedForLater: validatedData.savedForLater },
    });

    revalidatePath("/cart");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Save for later error:", error);
    return {
      success: false,
      error: "Failed to update cart item",
    };
  }
}

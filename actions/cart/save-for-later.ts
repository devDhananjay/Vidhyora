"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  getOrCreateCartSession,
  ownsCart,
} from "@/lib/cart/cart-session";
import { saveForLaterSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function toggleSaveForLater(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const owner = await getOrCreateCartSession();

    const rawData = {
      cartItemId: formData.get("cartItemId"),
      savedForLater: formData.get("savedForLater") === "true",
    };

    const validatedData = saveForLaterSchema.parse(rawData);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: { cart: true },
    });

    if (!cartItem || !ownsCart(cartItem.cart, owner)) {
      return { success: false, error: "Cart item not found" };
    }

    await prisma.cartItem.update({
      where: { id: validatedData.cartItemId },
      data: { savedForLater: validatedData.savedForLater },
    });

    revalidatePath("/cart");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Save for later error:", error);
    return { success: false, error: "Failed to update cart item" };
  }
}

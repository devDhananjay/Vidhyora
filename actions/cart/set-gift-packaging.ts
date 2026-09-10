"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart/cart-session";
import type { ActionResult } from "@/lib/utils";

export async function setCartItemGiftPackaging(
  cartItemId: string,
  giftPackaging: boolean,
): Promise<ActionResult<void>> {
  try {
    const { cartId } = await getOrCreateCartSession();
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId },
    });
    if (!item) {
      return { success: false, error: "Cart item not found" };
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { giftPackaging },
    });

    revalidatePath("/cart");
    revalidatePath("/checkout");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("setCartItemGiftPackaging error:", error);
    return { success: false, error: "Failed to update gift packaging" };
  }
}

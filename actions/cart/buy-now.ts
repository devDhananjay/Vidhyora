"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart/cart-session";
import { addToCartSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

/**
 * Add a single variant to cart for immediate checkout.
 * Returns cartItemId so checkout can order only this line.
 */
export async function buyNow(
  formData: FormData,
): Promise<ActionResult<{ cartItemId: string; checkoutUrl: string }>> {
  try {
    const rawData = {
      productId: formData.get("productId"),
      variantId: formData.get("variantId"),
      quantity: parseInt(String(formData.get("quantity") || "1"), 10) || 1,
      giftPackaging: formData.get("giftPackaging") === "true",
    };

    const validatedData = addToCartSchema.parse(rawData);

    const variant = await prisma.productVariant.findUnique({
      where: { id: validatedData.variantId },
      include: {
        product: {
          select: { status: true, approvalStatus: true },
        },
      },
    });

    if (!variant) {
      return { success: false, error: "Product variant not found" };
    }

    if (
      variant.product.status !== "ACTIVE" ||
      variant.product.approvalStatus !== "APPROVED"
    ) {
      return { success: false, error: "Product is not available" };
    }

    if (variant.productId !== validatedData.productId) {
      return { success: false, error: "Variant does not match product" };
    }

    const availableStock = variant.stock - variant.reservedStock;
    if (availableStock < validatedData.quantity) {
      return {
        success: false,
        error:
          availableStock <= 0
            ? "Out of stock"
            : `Only ${availableStock} items available in stock`,
      };
    }

    const { cartId } = await getOrCreateCartSession();

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        variantId: validatedData.variantId,
        savedForLater: false,
      },
    });

    let cartItemId: string;
    if (existingItem) {
      // Buy now uses quantity 1 for this checkout line (don't balloon qty)
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: Math.max(existingItem.quantity, validatedData.quantity),
          giftPackaging:
            validatedData.giftPackaging || existingItem.giftPackaging,
          savedForLater: false,
        },
      });
      cartItemId = existingItem.id;
    } else {
      const created = await prisma.cartItem.create({
        data: {
          cartId,
          productId: validatedData.productId,
          variantId: validatedData.variantId,
          quantity: validatedData.quantity,
          giftPackaging: validatedData.giftPackaging,
        },
      });
      cartItemId = created.id;
    }

    revalidatePath("/cart");
    revalidatePath("/", "layout");

    return {
      success: true,
      data: {
        cartItemId,
        checkoutUrl: `/checkout?buyNow=${encodeURIComponent(cartItemId)}`,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid buy now data",
      };
    }
    console.error("Buy now error:", error);
    return { success: false, error: "Failed to start checkout" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { getOrCreateCartSession } from "@/lib/cart/cart-session";
import { addToCartSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function addToCart(
  formData: FormData,
): Promise<ActionResult<{ cartItemId: string }>> {
  try {
    const rawData = {
      productId: formData.get("productId"),
      variantId: formData.get("variantId"),
      quantity: parseInt(formData.get("quantity") as string) || 1,
      giftPackaging: formData.get("giftPackaging") === "true",
    };

    const validatedData = addToCartSchema.parse(rawData);

    const variant = await prisma.productVariant.findUnique({
      where: { id: validatedData.variantId },
      include: {
        product: {
          select: {
            status: true,
            approvalStatus: true,
          },
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

    const availableStock = variant.stock - variant.reservedStock;
    if (availableStock < validatedData.quantity) {
      return {
        success: false,
        error: `Only ${availableStock} items available in stock`,
      };
    }

    const { cartId } = await getOrCreateCartSession();

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId: validatedData.variantId,
        },
      },
    });

    let cartItemId: string;

    if (existingItem) {
      const newQuantity = existingItem.quantity + validatedData.quantity;

      if (availableStock < newQuantity) {
        return {
          success: false,
          error: `Only ${availableStock} items available in stock`,
        };
      }

      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          savedForLater: false,
          giftPackaging:
            validatedData.giftPackaging || existingItem.giftPackaging,
        },
      });
      cartItemId = updated.id;
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
    revalidatePath("/");

    return {
      success: true,
      data: { cartItemId },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid cart data",
      };
    }
    console.error("Add to cart error:", error);
    return {
      success: false,
      error: "Failed to add item to cart",
    };
  }
}

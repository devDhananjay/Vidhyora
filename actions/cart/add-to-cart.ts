"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { addToCartSchema } from "@/lib/validations/cart";
import type { ActionResult } from "@/lib/utils";

export async function addToCart(
  formData: FormData,
): Promise<ActionResult<{ cartItemId: string }>> {
  try {
    const session = await requireAuth();

    const rawData = {
      productId: formData.get("productId"),
      variantId: formData.get("variantId"),
      quantity: parseInt(formData.get("quantity") as string) || 1,
    };

    const validatedData = addToCartSchema.parse(rawData);

    // Check if variant exists and has stock
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
      return {
        success: false,
        error: "Product variant not found",
      };
    }

    if (
      variant.product.status !== "ACTIVE" ||
      variant.product.approvalStatus !== "APPROVED"
    ) {
      return {
        success: false,
        error: "Product is not available",
      };
    }

    const availableStock = variant.stock - variant.reservedStock;
    if (availableStock < validatedData.quantity) {
      return {
        success: false,
        error: `Only ${availableStock} items available in stock`,
      };
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: validatedData.variantId,
        },
      },
    });

    let cartItemId: string;

    if (existingItem) {
      // Update quantity
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
        },
      });
      cartItemId = updated.id;
    } else {
      // Create new cart item
      const created = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          variantId: validatedData.variantId,
          quantity: validatedData.quantity,
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
    console.error("Add to cart error:", error);
    return {
      success: false,
      error: "Failed to add item to cart",
    };
  }
}

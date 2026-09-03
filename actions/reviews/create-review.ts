"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { createReviewSchema } from "@/lib/validations/review";
import type { ActionResult } from "@/lib/utils";

export async function createReview(
  formData: FormData,
): Promise<ActionResult<{ reviewId: string }>> {
  try {
    const session = await requireAuth();

    const rawData = {
      productId: formData.get("productId"),
      orderItemId: formData.get("orderItemId"),
      rating: parseInt(formData.get("rating") as string),
      title: formData.get("title"),
      comment: formData.get("comment"),
      images: formData.get("images")
        ? JSON.parse(formData.get("images") as string)
        : [],
    };

    const validatedData = createReviewSchema.parse(rawData);

    // Verify order item belongs to user and is delivered
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: validatedData.orderItemId,
        productId: validatedData.productId,
      },
      include: {
        order: true,
        product: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!orderItem || orderItem.order.userId !== session.user.id) {
      return {
        success: false,
        error: "Order item not found",
      };
    }

    if (orderItem.order.orderStatus !== "DELIVERED") {
      return {
        success: false,
        error: "You can only review products that have been delivered",
      };
    }

    // Check if user already reviewed this order item
    const existingReview = await prisma.review.findFirst({
      where: {
        orderItemId: validatedData.orderItemId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: "You have already reviewed this product",
      };
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
        orderItemId: validatedData.orderItemId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        images: validatedData.images || [],
        status: "PENDING", // Reviews need moderation
      },
    });

    revalidatePath(`/products/${orderItem.product.slug}`);
    revalidatePath("/account/reviews");

    return {
      success: true,
      data: { reviewId: review.id },
    };
  } catch (error) {
    console.error("Create review error:", error);
    return {
      success: false,
      error: "Failed to submit review",
    };
  }
}

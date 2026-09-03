"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { markReviewHelpfulSchema } from "@/lib/validations/review";
import type { ActionResult } from "@/lib/utils";

export async function markReviewHelpful(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const rawData = {
      reviewId: formData.get("reviewId"),
      helpful: formData.get("helpful") === "true",
    };

    const validatedData = markReviewHelpfulSchema.parse(rawData);

    // Check if user already marked this review
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        userId_reviewId: {
          userId: session.user.id,
          reviewId: validatedData.reviewId,
        },
      },
    });

    if (existing) {
      // Update existing vote
      await prisma.reviewHelpful.update({
        where: {
          userId_reviewId: {
            userId: session.user.id,
            reviewId: validatedData.reviewId,
          },
        },
        data: {
          helpful: validatedData.helpful,
        },
      });
    } else {
      // Create new vote
      await prisma.reviewHelpful.create({
        data: {
          userId: session.user.id,
          reviewId: validatedData.reviewId,
          helpful: validatedData.helpful,
        },
      });
    }

    // Update review helpful/unhelpful counts
    const counts = await prisma.reviewHelpful.groupBy({
      by: ["helpful"],
      where: { reviewId: validatedData.reviewId },
      _count: true,
    });

    const helpfulCount = counts.find((c) => c.helpful)?._count || 0;
    const unhelpfulCount = counts.find((c) => !c.helpful)?._count || 0;

    await prisma.review.update({
      where: { id: validatedData.reviewId },
      data: {
        helpfulCount,
        unhelpfulCount,
      },
    });

    revalidatePath("/products/");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Mark review helpful error:", error);
    return {
      success: false,
      error: "Failed to update review",
    };
  }
}

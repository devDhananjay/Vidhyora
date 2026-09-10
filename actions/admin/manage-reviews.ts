"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function getReviewsByStatus(
  status: "PENDING" | "APPROVED" | "REJECTED" | "ALL" = "PENDING",
) {
  try {
    await requireAdmin();

    return prisma.review.findMany({
      where: status === "ALL" ? undefined : { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
            thumbnail: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (error) {
    console.error("Get reviews by status error:", error);
    return [];
  }
}

export async function getPendingReviews() {
  return getReviewsByStatus("PENDING");
}

export async function approveReview(
  reviewId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "APPROVED" },
    });

    revalidatePath("/admin/reviews");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Approve review error:", error);
    return {
      success: false,
      error: "Failed to approve review",
    };
  }
}

export async function rejectReview(
  reviewId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/admin/reviews");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Reject review error:", error);
    return {
      success: false,
      error: "Failed to reject review",
    };
  }
}

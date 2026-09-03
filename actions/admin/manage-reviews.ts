"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function getPendingReviews() {
  try {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      where: { status: "PENDING" },
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
    });

    return reviews;
  } catch (error) {
    console.error("Get pending reviews error:", error);
    return [];
  }
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

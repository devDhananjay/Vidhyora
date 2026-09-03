"use server";

import prisma from "@/lib/prisma";
import { calculateReviewStats } from "@/lib/reviews/review-utils";
import type { ReviewWithUser, ReviewStats, ReviewFilters } from "@/types/review";

export async function getProductReviews(
  productId: string,
  filters: ReviewFilters = {},
): Promise<{ reviews: ReviewWithUser[]; stats: ReviewStats }> {
  try {
    // Build where clause
    const where: any = {
      productId,
      status: "APPROVED",
    };

    if (filters.rating) {
      where.rating = filters.rating;
    }

    if (filters.verified !== undefined) {
      if (filters.verified) {
        where.orderItemId = { not: null };
      }
    }

    if (filters.withImages) {
      where.images = { isEmpty: false };
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" }; // Default: recent

    if (filters.sortBy === "helpful") {
      orderBy = { helpfulCount: "desc" };
    } else if (filters.sortBy === "rating-high") {
      orderBy = { rating: "desc" };
    } else if (filters.sortBy === "rating-low") {
      orderBy = { rating: "asc" };
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy,
      take: 50, // Limit for performance
    });

    // Get all reviews for stats (not filtered)
    const allReviews = await prisma.review.findMany({
      where: {
        productId,
        status: "APPROVED",
      },
      select: { rating: true },
    });

    const stats = calculateReviewStats(allReviews);

    return {
      reviews: reviews as ReviewWithUser[],
      stats,
    };
  } catch (error) {
    console.error("Get product reviews error:", error);
    return {
      reviews: [],
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }
}

export async function getUserReviews(userId: string): Promise<ReviewWithUser[]> {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews as ReviewWithUser[];
  } catch (error) {
    console.error("Get user reviews error:", error);
    return [];
  }
}

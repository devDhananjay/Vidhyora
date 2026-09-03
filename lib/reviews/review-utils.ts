import type { ReviewStats } from "@/types/review";

export function calculateReviewStats(reviews: Array<{ rating: number }>): ReviewStats {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = sum / totalReviews;

  const ratingDistribution = reviews.reduce(
    (acc, review) => {
      acc[review.rating as keyof typeof acc]++;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    ratingDistribution,
  };
}

export function canUserReview(
  userId: string,
  productId: string,
  orderItems: Array<{
    userId: string;
    productId: string;
    orderId: string;
    orderStatus: string;
  }>,
  existingReviews: Array<{ orderItemId: string }>,
): { canReview: boolean; orderItemId?: string; reason?: string } {
  // Find delivered order items for this product
  const deliveredItems = orderItems.filter(
    (item) =>
      item.userId === userId &&
      item.productId === productId &&
      item.orderStatus === "DELIVERED",
  );

  if (deliveredItems.length === 0) {
    return {
      canReview: false,
      reason: "You can only review products you have purchased and received",
    };
  }

  // Check if user already reviewed this product
  const reviewedItemIds = existingReviews.map((r) => r.orderItemId);
  const unreviewedItem = deliveredItems.find(
    (item) => !reviewedItemIds.includes(item.orderId),
  );

  if (!unreviewedItem) {
    return {
      canReview: false,
      reason: "You have already reviewed this product",
    };
  }

  return {
    canReview: true,
    orderItemId: unreviewedItem.orderId,
  };
}

export function getReviewVerificationBadge(hasOrderItem: boolean): {
  label: string;
  color: string;
} {
  if (hasOrderItem) {
    return {
      label: "Verified Purchase",
      color: "green",
    };
  }
  return {
    label: "Unverified",
    color: "gray",
  };
}

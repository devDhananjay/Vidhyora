"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewFiltersBar } from "@/components/reviews/review-filters-bar";
import type { ReviewWithUser, ReviewFilters } from "@/types/review";

type ReviewsListProps = {
  initialReviews: ReviewWithUser[];
  productId: string;
};

export function ReviewsList({ initialReviews, productId }: ReviewsListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filters, setFilters] = useState<ReviewFilters>({});

  const handleFilterChange = async (newFilters: ReviewFilters) => {
    setFilters(newFilters);

    // Fetch filtered reviews
    const response = await fetch(
      `/api/reviews/${productId}?` +
        new URLSearchParams({
          ...(newFilters.rating && { rating: newFilters.rating.toString() }),
          ...(newFilters.verified !== undefined && {
            verified: newFilters.verified.toString(),
          }),
          ...(newFilters.withImages && { withImages: "true" }),
          ...(newFilters.sortBy && { sortBy: newFilters.sortBy }),
        }),
    );

    if (response.ok) {
      const data = await response.json();
      setReviews(data.reviews);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No reviews found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReviewFiltersBar
        onFilterChange={handleFilterChange}
        totalReviews={reviews.length}
      />

      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isVerified={!!review.orderItemId}
          />
        ))}
      </div>
    </div>
  );
}

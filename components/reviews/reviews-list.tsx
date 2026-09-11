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
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = async (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (newFilters.rating) params.set("rating", String(newFilters.rating));
      if (newFilters.verified !== undefined) {
        params.set("verified", String(newFilters.verified));
      }
      if (newFilters.withImages) params.set("withImages", "true");
      if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);

      const response = await fetch(`/api/reviews/${productId}?${params}`);

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.rating || filters.verified || filters.withImages,
  );

  return (
    <div className="space-y-6">
      <ReviewFiltersBar
        onFilterChange={handleFilterChange}
        totalReviews={reviews.length}
      />

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "No reviews match these filters"
              : "No reviews found"}
          </p>
          {hasActiveFilters ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Try another star rating or clear filters.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isVerified={!!review.orderItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

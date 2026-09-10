"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Filter } from "lucide-react";
import type { ReviewFilters } from "@/types/review";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReviewFiltersBarProps = {
  onFilterChange: (filters: ReviewFilters) => void;
  totalReviews: number;
};

export function ReviewFiltersBar({
  onFilterChange,
  totalReviews,
}: ReviewFiltersBarProps) {
  const [selectedRating, setSelectedRating] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<ReviewFilters["sortBy"]>("recent");
  const [verified, setVerified] = useState(false);
  const [withImages, setWithImages] = useState(false);

  const emit = (next: {
    rating?: number;
    verified?: boolean;
    withImages?: boolean;
    sortBy?: ReviewFilters["sortBy"];
  }) => {
    onFilterChange({
      rating: next.rating,
      verified: next.verified || undefined,
      withImages: next.withImages || undefined,
      sortBy: next.sortBy ?? "recent",
    });
  };

  const clearFilters = () => {
    setSelectedRating(undefined);
    setVerified(false);
    setWithImages(false);
    setSortBy("recent");
    onFilterChange({ sortBy: "recent" });
  };

  const hasActiveFilters = Boolean(selectedRating || verified || withImages);

  return (
    <div className="space-y-3 border-b pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="size-4" />
          Filter Reviews ({totalReviews})
        </div>

        <div className="flex flex-wrap gap-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              type="button"
              variant={selectedRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const next =
                  selectedRating === rating ? undefined : rating;
                setSelectedRating(next);
                emit({
                  rating: next,
                  verified,
                  withImages,
                  sortBy,
                });
              }}
              className="gap-1"
            >
              {rating}
              <Star className="size-3 fill-current" />
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant={verified ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const next = !verified;
            setVerified(next);
            emit({
              rating: selectedRating,
              verified: next,
              withImages,
              sortBy,
            });
          }}
        >
          Verified Only
        </Button>

        <Button
          type="button"
          variant={withImages ? "default" : "outline"}
          size="sm"
          onClick={() => {
            const next = !withImages;
            setWithImages(next);
            emit({
              rating: selectedRating,
              verified,
              withImages: next,
              sortBy,
            });
          }}
        >
          With Images
        </Button>

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        ) : null}
      </div>

      <Select
        value={sortBy}
        onValueChange={(value) => {
          const next = value as ReviewFilters["sortBy"];
          setSortBy(next);
          emit({
            rating: selectedRating,
            verified,
            withImages,
            sortBy: next,
          });
        }}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Most Recent</SelectItem>
          <SelectItem value="helpful">Most Helpful</SelectItem>
          <SelectItem value="rating-high">Highest Rating</SelectItem>
          <SelectItem value="rating-low">Lowest Rating</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

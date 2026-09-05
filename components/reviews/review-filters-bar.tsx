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
  const [verified, setVerified] = useState<boolean | undefined>();
  const [withImages, setWithImages] = useState(false);

  const handleFilterChange = (updates: Partial<ReviewFilters>) => {
    const newFilters: ReviewFilters = {
      rating: selectedRating,
      verified,
      withImages,
      sortBy,
      ...updates,
    };

    // Update local state
    if (updates.rating !== undefined) setSelectedRating(updates.rating);
    if (updates.verified !== undefined) setVerified(updates.verified);
    if (updates.withImages !== undefined) setWithImages(updates.withImages);
    if (updates.sortBy !== undefined) setSortBy(updates.sortBy);

    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setSelectedRating(undefined);
    setVerified(undefined);
    setWithImages(false);
    setSortBy("recent");
    onFilterChange({});
  };

  const hasActiveFilters = selectedRating || verified || withImages;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b pb-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="size-4" />
        Filter Reviews ({totalReviews})
      </div>

      {/* Rating Filter */}
      <div className="flex gap-1">
        {[5, 4, 3, 2, 1].map((rating) => (
          <Button
            key={rating}
            variant={selectedRating === rating ? "default" : "outline"}
            size="sm"
            onClick={() =>
              handleFilterChange({
                rating: selectedRating === rating ? undefined : rating,
              })
            }
            className="gap-1"
          >
            {rating}
            <Star className="size-3 fill-current" />
          </Button>
        ))}
      </div>

      {/* Verified Filter */}
      <Button
        variant={verified ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterChange({ verified: !verified })}
      >
        Verified Only
      </Button>

      {/* With Images Filter */}
      <Button
        variant={withImages ? "default" : "outline"}
        size="sm"
        onClick={() => handleFilterChange({ withImages: !withImages })}
      >
        With Images
      </Button>

      {/* Sort */}
      <Select
        value={sortBy}
        onValueChange={(value) =>
          handleFilterChange({ sortBy: value as ReviewFilters["sortBy"] })
        }
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

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

import type { Review, User } from "@prisma/client";

export type ReviewWithUser = Review & {
  user: {
    name: string | null;
    image: string | null;
  };
};

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type ReviewFilters = {
  rating?: number;
  verified?: boolean;
  withImages?: boolean;
  sortBy?: "recent" | "helpful" | "rating-high" | "rating-low";
};

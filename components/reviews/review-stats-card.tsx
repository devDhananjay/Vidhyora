import { StarRating } from "@/components/reviews/star-rating";
import type { ReviewStats } from "@/types/review";
import { Progress } from "@/components/ui/progress";

type ReviewStatsCardProps = {
  stats: ReviewStats;
};

export function ReviewStatsCard({ stats }: ReviewStatsCardProps) {
  if (stats.totalReviews === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to review this product!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
          <StarRating rating={stats.averageRating} size="sm" />
          <div className="mt-1 text-sm text-muted-foreground">
            {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage =
              stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex w-16 items-center gap-1">
                  <span className="text-sm">{rating}</span>
                  <StarRating rating={rating} size="sm" />
                </div>
                <Progress value={percentage} className="flex-1" />
                <span className="w-12 text-right text-sm text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

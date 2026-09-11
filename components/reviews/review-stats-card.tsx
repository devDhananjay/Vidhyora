import { Star } from "lucide-react";
import type { ReviewStats } from "@/types/review";

type ReviewStatsCardProps = {
  stats: ReviewStats;
};

export function ReviewStatsCard({ stats }: ReviewStatsCardProps) {
  if (stats.totalReviews === 0) {
    return (
      <div className="rounded-xl border p-6 text-center">
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Be the first to review this product!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-end gap-3">
          <div className="text-4xl font-bold leading-none text-neutral-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="pb-0.5">
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`size-4 ${
                    index < Math.round(stats.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-none text-neutral-300"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.totalReviews}{" "}
              {stats.totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              stats.ratingDistribution[
                rating as keyof typeof stats.ratingDistribution
              ] ?? 0;
            const percentage =
              stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

            return (
              <div key={rating} className="grid grid-cols-[2.5rem_1fr_1.5rem] items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-neutral-700">
                  <span className="tabular-nums">{rating}</span>
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-[#8b2e2e] transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                  />
                </div>
                <span className="text-right text-sm tabular-nums text-muted-foreground">
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

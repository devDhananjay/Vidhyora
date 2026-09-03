import type { Metadata } from "next";
import { getPendingReviews } from "@/actions/admin/manage-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewModerationCard } from "@/components/admin/review-moderation-card";

export const metadata: Metadata = {
  title: "Review Moderation | Super Admin",
};

export default async function AdminReviewsPage() {
  const reviews = await getPendingReviews();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Review Moderation</h1>
        <p className="mt-2 text-muted-foreground">
          Super Admin only: {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"} pending approve or reject
        </p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h3 className="mb-2 text-lg font-semibold">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No reviews pending moderation at this time
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <ReviewModerationCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

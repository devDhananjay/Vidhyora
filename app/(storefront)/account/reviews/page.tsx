import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserReviews } from "@/actions/reviews/get-reviews";
import { ReviewCard } from "@/components/reviews/review-card";
import { StarRating } from "@/components/reviews/star-rating";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "My Reviews | VIDYORA",
  description: "View and manage your product reviews",
};

export default async function MyReviewsPage() {
  const session = await requireAuth();

  if (!session) {
    redirect("/login?callbackUrl=/account/reviews");
  }

  const reviews = await getUserReviews(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-neutral-900">My Reviews</h1>
        <p className="mt-2 text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold">No reviews yet</h2>
          <p className="mb-6 text-muted-foreground">
            Start reviewing products you've purchased
          </p>
          <Link
            href="/orders"
            className="inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border p-6"
            >
              <ReviewCard review={review} isVerified={!!review.orderItemId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

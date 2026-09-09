import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserReviews } from "@/actions/reviews/get-reviews";
import { AccountBackLink } from "@/components/account/account-back-link";
import { ReviewCard } from "@/components/reviews/review-card";
import Link from "next/link";

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
    <div className="bg-[#faf8f6]">
      <div className="container mx-auto px-4 py-8">
        <AccountBackLink />
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
            My Reviews
          </h1>
          <p className="mt-2 text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-neutral-100 bg-white p-12 text-center">
            <h2 className="mb-2 font-serif text-xl text-neutral-900">
              No reviews yet
            </h2>
            <p className="mb-6 text-muted-foreground">
              Start reviewing products you&apos;ve purchased
            </p>
            <Link
              href="/orders"
              className="inline-flex rounded-full bg-[#8b2e2e] px-6 py-3 text-sm font-medium text-white hover:bg-[#7a2727]"
            >
              View My Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-neutral-100 bg-white p-6"
              >
                <ReviewCard
                  review={review}
                  isVerified={!!review.orderItemId}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

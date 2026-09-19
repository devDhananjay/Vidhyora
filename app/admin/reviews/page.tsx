import type { Metadata } from "next";
import Link from "next/link";
import { getReviewsByStatus } from "@/actions/admin/manage-reviews";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewModerationCard } from "@/components/admin/review-moderation-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Review Moderation | Admin",
};

const TABS = [
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ALL", label: "All" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusRaw = (params.status || "PENDING").toUpperCase();
  const status = (
    ["PENDING", "APPROVED", "REJECTED", "ALL"].includes(statusRaw)
      ? statusRaw
      : "PENDING"
  ) as "PENDING" | "APPROVED" | "REJECTED" | "ALL";

  const reviews = await getReviewsByStatus(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Review Moderation
        </h1>
        <p className="mt-2 text-muted-foreground">
          {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"} in this view
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/reviews?status=${tab.id}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm",
              status === tab.id
                ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]/40",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold">No reviews here</h3>
            <p className="text-muted-foreground">
              Nothing matched this status filter.
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

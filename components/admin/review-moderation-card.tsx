"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/reviews/star-rating";
import { approveReview, rejectReview } from "@/actions/admin/manage-reviews";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: any;
  createdAt: Date;
  user: {
    name: string | null;
    email: string;
  };
  product: {
    name: string;
    thumbnail: string | null;
    slug: string;
  };
};

type ReviewModerationCardProps = {
  review: Review;
};

export function ReviewModerationCard({ review }: ReviewModerationCardProps) {
  const [isPending, startTransition] = useTransition();
  const reviewImages = review.images as string[] | null;

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveReview(review.id);
      if (result.success) {
        alert("Review approved!");
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleReject = () => {
    if (confirm("Are you sure you want to reject this review?")) {
      startTransition(async () => {
        const result = await rejectReview(review.id);
        if (result.success) {
          alert("Review rejected!");
          window.location.reload();
        } else {
          alert(result.error);
        }
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative size-20 shrink-0 overflow-hidden rounded">
            {review.product.thumbnail ? (
              <Image
                src={review.product.thumbnail}
                alt={review.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                📦
              </div>
            )}
          </div>

          {/* Review Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <Link
                  href={`/products/${review.product.slug}`}
                  className="font-semibold hover:text-primary"
                >
                  {review.product.name}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{review.user.name}</span>
                  <span>•</span>
                  <span>{format(new Date(review.createdAt), "MMM dd, yyyy")}</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-yellow-50">
                PENDING
              </Badge>
            </div>

            {/* Rating */}
            <div>
              <StarRating rating={review.rating} size="sm" />
            </div>

            {/* Title */}
            {review.title && (
              <div className="font-semibold">{review.title}</div>
            )}

            {/* Comment */}
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}

            {/* Images */}
            {reviewImages && reviewImages.length > 0 && (
              <div className="flex gap-2">
                {reviewImages.slice(0, 3).map((image, index) => (
                  <div
                    key={index}
                    className="relative size-16 overflow-hidden rounded border"
                  >
                    <Image
                      src={image}
                      alt={`Review image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleApprove}
                disabled={isPending}
                size="sm"
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle className="size-4" />
                Approve
              </Button>
              <Button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                size="sm"
                className="gap-2 bg-red-600 text-white hover:bg-red-700"
              >
                <XCircle className="size-4" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

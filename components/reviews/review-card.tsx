"use client";

import { useState, useTransition } from "react";
import { StarRating } from "@/components/reviews/star-rating";
import type { ReviewWithUser } from "@/types/review";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { markReviewHelpful } from "@/actions/reviews/mark-helpful";
import Image from "next/image";

type ReviewCardProps = {
  review: ReviewWithUser;
  isVerified?: boolean;
};

export function ReviewCard({ review, isVerified = false }: ReviewCardProps) {
  const [isPending, startTransition] = useTransition();
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpfulCount);

  const handleHelpful = (helpful: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("reviewId", review.id);
      formData.append("helpful", helpful.toString());

      const result = await markReviewHelpful(formData);

      if (result.success) {
        // Optimistically update counts
        if (helpful) {
          setHelpfulCount((prev) => prev + 1);
        } else {
          setUnhelpfulCount((prev) => prev + 1);
        }
      } else {
        alert(result.error);
      }
    });
  };

  const reviewImages = review.images as string[] | null;

  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {review.user.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="mb-2 flex items-center gap-2">
            <span className="font-medium">{review.user.name || "Anonymous"}</span>
            {isVerified && (
              <Badge variant="outline" className="text-xs text-green-600">
                Verified Purchase
              </Badge>
            )}
          </div>

          {/* Rating & Date */}
          <div className="mb-2 flex items-center gap-3">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(review.createdAt), "MMM dd, yyyy")}
            </span>
          </div>

          {/* Title */}
          <h4 className="mb-2 font-semibold">{review.title}</h4>

          {/* Comment */}
          <p className="mb-3 text-sm text-muted-foreground">{review.comment}</p>

          {/* Images */}
          {reviewImages && reviewImages.length > 0 && (
            <div className="mb-3 flex gap-2">
              {reviewImages.map((image, index) => (
                <div
                  key={index}
                  className="relative size-20 overflow-hidden rounded border"
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

          {/* Helpful Buttons */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Was this helpful?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleHelpful(true)}
              disabled={isPending}
              className="gap-2"
            >
              <ThumbsUp className="size-4" />
              Yes ({helpfulCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleHelpful(false)}
              disabled={isPending}
              className="gap-2"
            >
              <ThumbsDown className="size-4" />
              No ({unhelpfulCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

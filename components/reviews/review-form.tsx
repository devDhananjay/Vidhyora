"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, type CreateReviewInput } from "@/lib/validations/review";
import { createReview } from "@/actions/reviews/create-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/reviews/star-rating";
import { Star } from "lucide-react";

type ReviewFormProps = {
  productId: string;
  orderItemId: string;
  productName: string;
  onSuccess?: () => void;
};

export function ReviewForm({
  productId,
  orderItemId,
  productName,
  onSuccess,
}: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Partial<CreateReviewInput>>({
    resolver: zodResolver(createReviewSchema) as any,
  });

  const onSubmit = async (data: Partial<CreateReviewInput>) => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderItemId", orderItemId);
      formData.append("rating", rating.toString());
      formData.append("title", data.title || "");
      formData.append("comment", data.comment || "");
      formData.append("images", JSON.stringify([]));

      const result = await createReview(formData);

      if (result.success) {
        alert("Review submitted successfully! It will be published after moderation.");
        onSuccess?.();
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 text-lg font-semibold">Write a Review</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Reviewing: <span className="font-medium">{productName}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Rating */}
        <div>
          <Label>Rating *</Label>
          <div className="mt-2 flex items-center gap-2">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
            {rating > 0 && (
              <span className="text-sm text-muted-foreground">
                ({rating} {rating === 1 ? "star" : "stars"})
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Review Title *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Summarize your experience"
            className="mt-2"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <Label htmlFor="comment">Your Review *</Label>
          <Textarea
            id="comment"
            {...register("comment")}
            placeholder="What did you like or dislike? How did you use this product?"
            rows={6}
            className="mt-2"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 20 characters
          </p>
          {errors.comment && (
            <p className="mt-1 text-sm text-destructive">
              {errors.comment.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Submitting..." : "Submit Review"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Your review will be published after our moderation team approves it.
        </p>
      </form>
    </div>
  );
}

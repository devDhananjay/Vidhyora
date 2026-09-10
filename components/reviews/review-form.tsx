"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createReview } from "@/actions/reviews/create-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/reviews/star-rating";

const reviewFormSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  comment: z
    .string()
    .min(20, "Review must be at least 20 characters")
    .max(1000, "Review must be at most 1000 characters"),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

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
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      title: "",
      comment: "",
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    if (rating < 1) {
      setRatingError("Please select a rating");
      return;
    }

    setRatingError(null);
    setSubmitError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("orderItemId", orderItemId);
      formData.append("rating", String(rating));
      formData.append("title", data.title.trim());
      formData.append("comment", data.comment.trim());
      formData.append("images", JSON.stringify([]));

      const result = await createReview(formData);

      if (result.success) {
        onSuccess?.();
        router.refresh();
      } else {
        setSubmitError(result.error || "Failed to submit review");
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Reviewing: <span className="font-medium text-foreground">{productName}</span>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label>Rating *</Label>
          <div className="mt-2 flex items-center gap-2">
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={(value) => {
                setRating(value);
                setRatingError(null);
              }}
            />
            {rating > 0 ? (
              <span className="text-sm text-muted-foreground">
                ({rating} {rating === 1 ? "star" : "stars"})
              </span>
            ) : null}
          </div>
          {ratingError ? (
            <p className="mt-1 text-sm text-destructive">{ratingError}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="title">Review Title *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Summarize your experience"
            className="mt-2"
          />
          {errors.title ? (
            <p className="mt-1 text-sm text-destructive">
              {errors.title.message}
            </p>
          ) : null}
        </div>

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
          {errors.comment ? (
            <p className="mt-1 text-sm text-destructive">
              {errors.comment.message}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}

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

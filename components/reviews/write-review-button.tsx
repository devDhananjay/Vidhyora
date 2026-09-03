"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/reviews/review-form";
import { Star } from "lucide-react";

type WriteReviewButtonProps = {
  productId: string;
  productName: string;
  orderItemId: string;
  hasReview: boolean;
};

export function WriteReviewButton({
  productId,
  productName,
  orderItemId,
  hasReview,
}: WriteReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (hasReview) {
    return (
      <Button variant="outline" size="sm" disabled>
        Already Reviewed
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Star className="size-4" />
        Write Review
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <ReviewForm
            productId={productId}
            productName={productName}
            orderItemId={orderItemId}
            onSuccess={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

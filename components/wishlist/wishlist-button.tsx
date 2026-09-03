"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist/manage-wishlist";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  isInWishlist?: boolean;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
};

export function WishlistButton({
  productId,
  isInWishlist = false,
  size = "icon",
  variant = "outline",
}: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      if (inWishlist) {
        const result = await removeFromWishlist(productId);
        if (result.success) {
          setInWishlist(false);
        } else {
          alert(result.error);
        }
      } else {
        const result = await addToWishlist(productId);
        if (result.success) {
          setInWishlist(true);
        } else {
          alert(result.error);
        }
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className={cn(inWishlist && "text-red-500")}
    >
      <Heart
        className={cn("size-5", inWishlist && "fill-current")}
      />
    </Button>
  );
}

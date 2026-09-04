"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist/manage-wishlist";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  productId: string;
  isInWishlist?: boolean;
};

export function WishlistButton({
  productId,
  isInWishlist = false,
}: WishlistButtonProps) {
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      if (inWishlist) {
        const result = await removeFromWishlist(productId);
        if (result.success) {
          setInWishlist(false);
          return;
        }
        if (result.error.toLowerCase().includes("sign in")) {
          redirectToLogin();
          return;
        }
        alert(result.error);
        return;
      }

      const result = await addToWishlist(productId);
      if (result.success) {
        setInWishlist(true);
        return;
      }
      if (result.error.toLowerCase().includes("sign in")) {
        redirectToLogin();
        return;
      }
      alert(result.error);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={inWishlist ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border bg-white transition hover:border-[#8b2e2e]/40 hover:bg-[#8b2e2e]/5 disabled:opacity-70",
        inWishlist
          ? "border-[#8b2e2e] text-[#8b2e2e]"
          : "border-neutral-200 text-[#8b2e2e]",
      )}
    >
      <Heart
        className={cn("size-5", inWishlist && "fill-[#8b2e2e]")}
        strokeWidth={1.8}
      />
    </button>
  );
}

function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?callbackUrl=${encodeURIComponent(next)}`;
}

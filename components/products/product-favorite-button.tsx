"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/actions/wishlist/manage-wishlist";
import { cn } from "@/lib/utils";

type ProductFavoriteButtonProps = {
  productId: string;
  isInWishlist?: boolean;
};

export function ProductFavoriteButton({
  productId,
  isInWishlist = false,
}: ProductFavoriteButtonProps) {
  const [saved, setSaved] = useState(isInWishlist);
  const [pending, startTransition] = useTransition();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    startTransition(async () => {
      if (saved) {
        const result = await removeFromWishlist(productId);
        if (result.success) {
          setSaved(false);
          return;
        }
        if (result.error.toLowerCase().includes("sign in")) {
          redirectToLogin();
        }
        return;
      }

      const result = await addToWishlist(productId);
      if (result.success) {
        setSaved(true);
        return;
      }
      if (result.error.toLowerCase().includes("sign in")) {
        redirectToLogin();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Remove from favourites" : "Add to favourites"}
      className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition hover:scale-105 disabled:opacity-70"
    >
      <Heart
        className={cn(
          "size-[18px] text-[#8b2e2e]",
          saved && "fill-[#8b2e2e]",
        )}
        strokeWidth={1.8}
      />
    </button>
  );
}

function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?callbackUrl=${encodeURIComponent(next)}`;
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCart } from "@/actions/cart/add-to-cart";
import { appAlert } from "@/components/shared/app-dialog";
import { openCartDrawer } from "@/lib/cart/open-cart-drawer";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string;
  inStock: boolean;
  giftPackaging?: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  variantId,
  inStock,
  giftPackaging = false,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!variantId) {
      await appAlert("Please select a variant");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("variantId", variantId);
      formData.append("quantity", "1");
      formData.append("giftPackaging", giftPackaging ? "true" : "false");

      const result = await addToCart(formData);

      if (result.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        // Open drawer first; refresh after so bag count updates without killing panel
        openCartDrawer();
        window.setTimeout(() => router.refresh(), 150);
        return;
      }

      await appAlert(result.error || "Failed to add to cart", {
        variant: "error",
      });
    });
  };

  return (
    <Button
      size="lg"
      onClick={handleAddToCart}
      disabled={!inStock || isPending}
      className={cn(
        "h-12 rounded-full bg-[#8b2e2e] text-white hover:bg-[#7a2727]",
        className,
      )}
    >
      {added ? (
        <>
          <Check className="mr-2 size-5" />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 size-5" />
          {isPending ? "Adding..." : inStock ? "Add to Cart" : "Out of Stock"}
        </>
      )}
    </Button>
  );
}

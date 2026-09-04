"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { addToCart } from "@/actions/cart/add-to-cart";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string;
  inStock: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  variantId,
  inStock,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!variantId) {
      alert("Please select a variant");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("variantId", variantId);
      formData.append("quantity", "1");

      const result = await addToCart(formData);

      if (result.success) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
        router.refresh();
      } else {
        alert(result.error || "Failed to add to cart");
      }
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

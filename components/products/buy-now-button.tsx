"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buyNow } from "@/actions/cart/buy-now";
import { appAlert } from "@/components/shared/app-dialog";

type BuyNowButtonProps = {
  productId: string;
  variantId?: string;
  inStock: boolean;
  giftPackaging?: boolean;
  className?: string;
};

export function BuyNowButton({
  productId,
  variantId,
  inStock,
  giftPackaging = false,
  className,
}: BuyNowButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleBuyNow = async () => {
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

      const result = await buyNow(formData);
      if (!result.success) {
        await appAlert(result.error || "Failed to start checkout", {
          variant: "error",
        });
        return;
      }
      router.push(result.data.checkoutUrl);
    });
  };

  return (
    <Button
      size="lg"
      onClick={handleBuyNow}
      disabled={!inStock || isPending}
      className={cn(
        "h-12 rounded-full border-2 border-[#8b2e2e] bg-white text-[#8b2e2e] hover:bg-[#8b2e2e] hover:text-white",
        className,
      )}
    >
      <Zap className="mr-2 size-4" strokeWidth={2} />
      {isPending ? "Please wait…" : inStock ? "Buy now" : "Out of Stock"}
    </Button>
  );
}

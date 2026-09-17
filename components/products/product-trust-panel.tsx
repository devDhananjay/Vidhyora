"use client";

import { ProductAlertNotify } from "@/components/products/product-alert-notify";
import { VidyoraAssurance } from "@/components/products/vidyora-assurance";

type ProductTrustPanelProps = {
  productId: string;
  productName: string;
  inStock?: boolean;
  baselinePrice?: number;
  variantId?: string;
};

export function ProductTrustPanel({
  productId,
  productName,
  inStock = true,
  baselinePrice,
  variantId,
}: ProductTrustPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
      {inStock ? (
        <ProductAlertNotify
          productId={productId}
          productName={productName}
          type="PRICE_DROP"
          baselinePrice={baselinePrice}
          variantId={variantId}
          compact
        />
      ) : (
        <ProductAlertNotify
          productId={productId}
          productName={productName}
          type="BACK_IN_STOCK"
          variantId={variantId}
          compact
        />
      )}
      <div className="border-t border-neutral-100" />
      <VidyoraAssurance compact />
    </div>
  );
}

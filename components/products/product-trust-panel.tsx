"use client";

import { PriceDropNotify } from "@/components/products/price-drop-notify";
import { VidyoraAssurance } from "@/components/products/vidyora-assurance";

type ProductTrustPanelProps = {
  productId: string;
  productName: string;
};

export function ProductTrustPanel({
  productId,
  productName,
}: ProductTrustPanelProps) {
  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-4 md:p-5">
      <PriceDropNotify productId={productId} productName={productName} compact />
      <div className="border-t border-neutral-100" />
      <VidyoraAssurance compact />
    </div>
  );
}

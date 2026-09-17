"use client";

import { ProductAlertNotify } from "@/components/products/product-alert-notify";

type PriceDropNotifyProps = {
  productId: string;
  productName: string;
  compact?: boolean;
  baselinePrice?: number;
};

/** Thin re-export so older imports keep working. */
export function PriceDropNotify(props: PriceDropNotifyProps) {
  return <ProductAlertNotify {...props} type="PRICE_DROP" />;
}

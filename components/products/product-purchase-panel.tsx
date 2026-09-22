"use client";

import { useMemo, useState } from "react";
import type { ProductVariant } from "@prisma/client";
import { Check, Ruler } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { sellableStock } from "@/lib/products/product-card-data";
import { ProductBuyActions } from "@/components/products/product-buy-actions";
import { SizeGuideDialog } from "@/components/products/size-guide-dialog";

type ProductPurchasePanelProps = {
  productId: string;
  variants: ProductVariant[];
  basePrice: number;
  productName: string;
  productText?: string;
  isInWishlist: boolean;
  whatsappNumber?: string;
  weightFallback?: string | null;
  sizeFallback?: string | null;
};

function attrRecord(variant: ProductVariant | undefined) {
  if (!variant?.attributes || typeof variant.attributes !== "object") return null;
  return variant.attributes as Record<string, string>;
}

export function ProductPurchasePanel({
  productId,
  variants,
  basePrice,
  productName,
  productText,
  isInWishlist,
  whatsappNumber,
  weightFallback,
  sizeFallback,
}: ProductPurchasePanelProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) || variants[0];
  const attributes = attrRecord(selectedVariant);

  const attributeTypes = useMemo(() => {
    const types = new Set<string>();
    variants.forEach((v) => {
      const attrs = attrRecord(v);
      if (attrs) Object.keys(attrs).forEach((key) => types.add(key));
    });
    return Array.from(types);
  }, [variants]);

  const showSizeGuide = attributeTypes.some((key) =>
    /size|ring|bangle|circumference|diameter/i.test(key),
  ) || /ring|bangle|bracelet|chain|necklace/i.test(productName);

  const price = selectedVariant ? Number(selectedVariant.price) : basePrice;
  const available = selectedVariant ? sellableStock(selectedVariant) : 0;
  const inStock = available > 0;
  const weightLabel = (() => {
    const raw = selectedVariant?.weight
      ? String(Number(selectedVariant.weight))
      : weightFallback?.trim() || "";
    if (!raw) return null;
    // Always show unit as capital G (e.g. Weight: 20 G)
    const numeric = raw.match(/([\d.]+)/)?.[1];
    if (numeric) return `${numeric} G`;
    return /gram|\bg\b/i.test(raw)
      ? raw.replace(/\s*(gram|g)\b/i, " G")
      : `${raw} G`;
  })();

  const sizeLabel = (() => {
    if (attributes) {
      const sizeKey = Object.keys(attributes).find((key) =>
        /size|ring|bangle|circumference|diameter|length/i.test(key),
      );
      const value = sizeKey ? attributes[sizeKey]?.trim() : null;
      if (value) return value;
    }
    if (sizeFallback?.trim()) return sizeFallback.trim();
    // Fallback: variant length field (e.g. chain length in inches)
    if (selectedVariant?.length != null) {
      const n = Number(selectedVariant.length);
      if (Number.isFinite(n) && n > 0) return `${n} inches`;
    }
    return null;
  })();

  return (
    <div className="space-y-5">
      {variants.length > 1 ? (
        <div className="space-y-4">
          {attributeTypes.map((attrType) => {
            const uniqueValues = new Set(
              variants
                .map((v) => attrRecord(v)?.[attrType])
                .filter(Boolean) as string[],
            );

            return (
              <div key={attrType}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium capitalize text-neutral-800">
                    {attrType}:{" "}
                    <span className="font-normal text-neutral-600">
                      {attributes?.[attrType]}
                    </span>
                  </div>
                  {showSizeGuide &&
                  /size|ring|bangle|circumference|diameter/i.test(attrType) ? (
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#8b2e2e] underline-offset-2 hover:underline"
                    >
                      <Ruler className="size-3.5" strokeWidth={1.7} />
                      Size guide
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(uniqueValues).map((value) => {
                    const variant = variants.find(
                      (v) => attrRecord(v)?.[attrType] === value,
                    );
                    if (!variant) return null;
                    const isSelected = variant.id === selectedVariantId;
                    const stockOk = sellableStock(variant) > 0;

                    return (
                      <button
                        key={`${attrType}-${value}`}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        disabled={!stockOk}
                        className={`relative flex min-w-[80px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition-colors ${
                          isSelected
                            ? "border-[#8b2e2e] bg-[#8b2e2e]/10 font-medium text-[#8b2e2e]"
                            : stockOk
                              ? "border-neutral-200 hover:border-[#8b2e2e]/50"
                              : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        {value}
                        {isSelected ? (
                          <Check className="ml-2 size-4 text-[#8b2e2e]" />
                        ) : null}
                        {!stockOk ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-px w-full rotate-[-15deg] bg-destructive" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {selectedVariant ? (
            <div className="text-sm text-muted-foreground">
              Price:{" "}
              <span className="font-semibold text-brand">
                {formatCurrency(price)}
              </span>
              {" · "}
              {inStock ? (
                <span className="text-green-600">
                  {available} in stock
                </span>
              ) : (
                <span className="text-destructive">Out of stock</span>
              )}
            </div>
          ) : null}
        </div>
      ) : showSizeGuide ? (
        <button
          type="button"
          onClick={() => setSizeGuideOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8b2e2e] underline-offset-2 hover:underline"
        >
          <Ruler className="size-4" strokeWidth={1.7} />
          Size guide
        </button>
      ) : null}

      <ProductBuyActions
        productId={productId}
        variantId={selectedVariant?.id}
        inStock={inStock}
        isInWishlist={isInWishlist}
        productName={productName}
        productText={productText}
        whatsappNumber={whatsappNumber}
        price={price}
        sizeLabel={sizeLabel}
        weightLabel={weightLabel}
      />

      <SizeGuideDialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ProductVariant } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";

type VariantSelectorProps = {
  variants: ProductVariant[];
  productId: string;
};

export function VariantSelector({ variants }: VariantSelectorProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);

  if (variants.length <= 1) {
    return null;
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const attributes = selectedVariant?.attributes as Record<string, string> | null;

  // Group variants by attribute type
  const attributeTypes = new Set<string>();
  variants.forEach((v) => {
    const attrs = v.attributes as Record<string, string> | null;
    if (attrs) {
      Object.keys(attrs).forEach((key) => attributeTypes.add(key));
    }
  });

  return (
    <div className="space-y-4">
      {Array.from(attributeTypes).map((attrType) => {
        const uniqueValues = new Set(
          variants
            .map((v) => {
              const attrs = v.attributes as Record<string, string> | null;
              return attrs?.[attrType];
            })
            .filter(Boolean),
        );

        return (
          <div key={attrType}>
            <div className="mb-2 text-sm font-medium capitalize">
              {attrType}: {attributes?.[attrType]}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(uniqueValues).map((value) => {
                const variant = variants.find((v) => {
                  const attrs = v.attributes as Record<string, string> | null;
                  return attrs?.[attrType] === value;
                });

                if (!variant) return null;

                const isSelected = variant.id === selectedVariantId;
                const inStock = variant.stock > 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    disabled={!inStock}
                    className={`relative flex min-w-[80px] items-center justify-center rounded-md border px-4 py-2 text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : inStock
                          ? "hover:border-primary"
                          : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {value}
                    {isSelected && (
                      <Check className="ml-2 size-4 text-primary" />
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-px w-full rotate-[-15deg] bg-destructive" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selectedVariant && (
        <div className="text-sm text-muted-foreground">
          Price: <span className="font-semibold text-foreground">
            {formatCurrency(Number(selectedVariant.price))}
          </span>
          {" • "}
          {selectedVariant.stock > 0 ? (
            <span className="text-green-600">{selectedVariant.stock} in stock</span>
          ) : (
            <span className="text-destructive">Out of stock</span>
          )}
        </div>
      )}
    </div>
  );
}

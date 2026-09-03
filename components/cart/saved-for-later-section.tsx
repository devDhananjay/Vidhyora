"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Trash2 } from "lucide-react";
import type { CartItemWithDetails } from "@/types/cart";
import { toggleSaveForLater } from "@/actions/cart/save-for-later";
import { removeCartItem } from "@/actions/cart/remove-cart-item";

type SavedForLaterSectionProps = {
  items: CartItemWithDetails[];
};

export function SavedForLaterSection({ items }: SavedForLaterSectionProps) {
  const [isPending, startTransition] = useTransition();

  const handleMoveToCart = (itemId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("cartItemId", itemId);
      formData.append("savedForLater", "false");

      const result = await toggleSaveForLater(formData);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleRemove = (itemId: string) => {
    if (!confirm("Remove this item permanently?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("cartItemId", itemId);

      const result = await removeCartItem(formData);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">
        Saved for Later ({items.length})
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const attributes = item.variant.attributes as Record<
            string,
            string
          > | null;

          return (
            <div key={item.id} className="rounded-lg border p-4">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative mb-3 block aspect-square overflow-hidden rounded"
              >
                {item.product.thumbnail ? (
                  <Image
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-6xl">
                    📦
                  </div>
                )}
              </Link>

              <Link
                href={`/products/${item.product.slug}`}
                className="mb-2 block font-medium hover:text-primary"
              >
                {item.product.name}
              </Link>

              {attributes && (
                <div className="mb-2 text-xs text-muted-foreground">
                  {Object.entries(attributes)
                    .slice(0, 2)
                    .map(([key, value]) => (
                      <span key={key}>
                        {key}: {value} |{" "}
                      </span>
                    ))}
                </div>
              )}

              <div className="mb-3 font-semibold">
                {formatCurrency(Number(item.variant.price))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleMoveToCart(item.id)}
                  disabled={isPending}
                >
                  <ShoppingCart className="mr-2 size-4" />
                  Move to Cart
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

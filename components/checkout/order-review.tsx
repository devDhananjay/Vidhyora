import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";
import type { CartItemWithDetails } from "@/types/cart";

type OrderReviewProps = {
  items: CartItemWithDetails[];
};

export function OrderReview({ items }: OrderReviewProps) {
  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center gap-2">
        <Package className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Review Items</h2>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const attributes = item.variant.attributes as Record<
            string,
            string
          > | null;

          return (
            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded"
              >
                {item.product.thumbnail ? (
                  <Image
                    src={item.product.thumbnail}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-muted text-3xl">
                    📦
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {item.product.name}
                </Link>

                {attributes && (
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(attributes)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <span key={key}>
                          {key}: {value} |{" "}
                        </span>
                      ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <span className="font-medium">
                    {formatCurrency(Number(item.variant.price))}
                  </span>
                  <span className="text-muted-foreground">
                    Qty: {item.quantity}
                  </span>
                </div>
              </div>

              <div className="text-right font-semibold">
                {formatCurrency(Number(item.variant.price) * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

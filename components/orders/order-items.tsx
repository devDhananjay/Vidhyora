import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { OrderItemWithDetails } from "@/types/order";
import { WriteReviewButton } from "@/components/reviews/write-review-button";

type OrderItemsProps = {
  items: OrderItemWithDetails[];
  orderStatus?: string;
};

export function OrderItems({ items, orderStatus }: OrderItemsProps) {
  const canReview = orderStatus === "DELIVERED";

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">
        Order Items ({items.length})
      </h2>

      <div className="space-y-4">
        {items.map((item) => {
          const attributes = item.variant.attributes as Record<
            string,
            string
          > | null;

          return (
            <div
              key={item.id}
              className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
            >
              <Link
                href={`/products/${item.product.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded"
              >
                {item.product.thumbnail ? (
                  <Image
                    src={item.product.thumbnail}
                    alt={item.productName}
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
                  {item.productName}
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

                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="font-medium">
                    {formatCurrency(Number(item.price))}
                  </span>
                  <span className="text-muted-foreground">
                    Qty: {item.quantity}
                  </span>
                </div>

                {/* Write Review Button */}
                {canReview && (
                  <div className="mt-2 flex gap-2">
                    <WriteReviewButton
                      productId={item.productId}
                      productName={item.productName}
                      orderItemId={item.id}
                      hasReview={item.reviews.length > 0}
                    />
                    <Link href={`/orders/${item.orderId}/return?itemId=${item.id}`}>
                      <Button variant="outline" size="sm">
                        Return/Replace
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="text-right font-semibold">
                {formatCurrency(Number(item.total))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

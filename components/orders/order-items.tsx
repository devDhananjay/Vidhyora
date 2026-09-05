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
    <div className="rounded-lg border p-4 sm:p-6">
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
              className="flex flex-col gap-3 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:gap-4"
            >
              <div className="flex gap-3 sm:contents">
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

                <div className="flex min-w-0 flex-1 flex-col gap-1">
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

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium">
                      {formatCurrency(Number(item.price))}
                    </span>
                    <span className="text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                  </div>

                  {/* Write Review Button */}
                  {canReview && (
                    <div className="mt-2 flex flex-wrap gap-2">
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
              </div>

              <div className="flex justify-between border-t pt-2 text-sm font-semibold sm:border-0 sm:pt-0 sm:text-right">
                <span className="text-muted-foreground sm:hidden">Total</span>
                {formatCurrency(Number(item.total))}
              </div>
            </div>
          );
        })}
      </div>
    </div>  );
}

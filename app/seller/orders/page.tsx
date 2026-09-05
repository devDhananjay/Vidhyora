import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSellerOrders } from "@/actions/seller/get-orders";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";
import { SellerFulfillmentActions } from "@/components/seller/seller-fulfillment-actions";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";

export const metadata: Metadata = {
  title: "Orders | Seller Dashboard",
};

export default async function SellerOrdersPage() {
  const orderItems = await getSellerOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">Orders</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {orderItems.length} {orderItems.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Orders List */}
      {orderItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📦</div>
            <h3 className="mb-2 text-lg font-semibold">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders will appear here when customers purchase your products
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orderItems.map((item) => {
            const attributes = item.variant.attributes as Record<
              string,
              string
            > | null;

            return (
              <Card key={item.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {/* Product Image */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded">
                      {item.product.thumbnail ? (
                        <Image
                          src={item.product.thumbnail}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/seller/orders/${item.id}`}
                            className="text-lg font-semibold hover:text-primary"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Order: {item.order.orderNumber}
                          </div>
                          {attributes && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              {Object.entries(attributes)
                                .slice(0, 2)
                                .map(([key, value]) => (
                                  <span key={key}>
                                    {key}: {value} |{" "}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                          <Badge variant="outline">
                            {getOrderStatusLabel(item.order.orderStatus)}
                          </Badge>
                          <PaymentStatusBadge
                            status={item.order.paymentStatus}
                            provider={item.order.payments[0]?.provider}
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
                        <div>
                          <div className="text-muted-foreground">Customer</div>
                          <div className="font-medium">
                            {item.order.user.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Amount</div>
                          <div className="font-semibold">
                            {formatCurrency(Number(item.total))}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Date</div>
                          <div className="font-medium">
                            {format(
                              new Date(item.order.createdAt),
                              "MMM dd, yyyy",
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Link href={`/seller/orders/${item.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <SellerFulfillmentActions
                          orderItemId={item.id}
                          currentStatus={item.order.orderStatus}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSellerOrderById } from "@/actions/seller/get-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  getOrderStatusLabel,
  getPaymentProviderLabel,
  paymentProviderFrom,
} from "@/lib/orders/order-utils";
import { format } from "date-fns";
import { SellerFulfillmentActions } from "@/components/seller/seller-fulfillment-actions";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";

export const metadata: Metadata = {
  title: "Order Details | Seller Dashboard",
};

export default async function SellerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderItem = await getSellerOrderById(id);

  if (!orderItem) {
    notFound();
  }

  const attributes = orderItem.variant.attributes as Record<
    string,
    string
  > | null;
  const shipping = (orderItem.order.shippingAddress ?? {}) as {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/seller/orders"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Orders
        </Link>
        <h1 className="mt-2 font-serif text-2xl text-neutral-900 sm:text-3xl md:text-4xl">
          Order #{orderItem.order.orderNumber}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {getOrderStatusLabel(orderItem.order.orderStatus)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Ordered on {format(new Date(orderItem.order.createdAt), "MMMM dd, yyyy")}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative size-24 shrink-0 overflow-hidden rounded">
                  {orderItem.product.thumbnail ? (
                    <Image
                      src={orderItem.product.thumbnail}
                      alt={orderItem.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted">
                      📦
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${orderItem.product.slug}`}
                    className="text-lg font-semibold hover:text-primary"
                  >
                    {orderItem.product.name}
                  </Link>

                  {attributes && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {Object.entries(attributes).map(([key, value]) => (
                        <div key={key}>
                          {key}: {value}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 sm:gap-4">
                    <div>
                      <div className="text-muted-foreground">SKU</div>
                      <div className="break-all font-medium">{orderItem.variant.sku}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium">{orderItem.quantity}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-semibold">
                        {formatCurrency(Number(orderItem.price))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{orderItem.order.user.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{orderItem.order.user.email}</div>
              </div>
              {orderItem.order.user.phone && (
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{orderItem.order.user.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="font-medium">{shipping.name}</div>
                <div>{shipping.addressLine1}</div>
                {shipping.addressLine2 ? <div>{shipping.addressLine2}</div> : null}
                <div>
                  {shipping.city}, {shipping.state} {shipping.postalCode}
                </div>
                <div>{shipping.country}</div>
                <div className="mt-2 text-muted-foreground">
                  Phone: {shipping.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(orderItem.price) * orderItem.quantity)}</span>
              </div>
              {Number(orderItem.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(Number(orderItem.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(Number(orderItem.tax))}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(Number(orderItem.total))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <PaymentStatusBadge
                    status={orderItem.order.paymentStatus}
                    provider={paymentProviderFrom(orderItem.order.payments)}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">
                    {getPaymentProviderLabel(
                      paymentProviderFrom(orderItem.order.payments),
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fulfillment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SellerFulfillmentActions
                orderItemId={orderItem.id}
                currentStatus={orderItem.order.orderStatus}
              />
              {orderItem.order.shipments[0] ? (
                <div className="border-t pt-4 text-sm">
                  <div className="font-medium">Shipment</div>
                  {orderItem.order.shipments[0].courier ? (
                    <p className="mt-1 text-muted-foreground">
                      Courier: {orderItem.order.shipments[0].courier}
                    </p>
                  ) : null}
                  {orderItem.order.shipments[0].trackingNumber ? (
                    <p className="text-muted-foreground">
                      Tracking: {orderItem.order.shipments[0].trackingNumber}
                    </p>
                  ) : null}
                  {orderItem.order.shipments[0].shippedAt ? (
                    <p className="text-muted-foreground">
                      Shipped{" "}
                      {format(
                        new Date(orderItem.order.shipments[0].shippedAt),
                        "MMM dd, yyyy",
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

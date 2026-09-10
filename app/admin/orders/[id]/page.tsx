import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdminOrderById } from "@/actions/admin/get-orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { AdminOrderCancelButton } from "@/components/admin/admin-order-cancel-button";
import { setViewAsSeller } from "@/actions/seller/view-as-seller";

export const metadata: Metadata = {
  title: "Order Details | Super Admin",
};

type AddressJson = {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  const shipping = (order.shippingAddress ?? {}) as AddressJson;
  const sellerIds = Array.from(
    new Set(
      order.items
        .map((item) => item.product.seller?.sellerId)
        .filter(Boolean) as string[],
    ),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
              {order.orderNumber}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {order.user.name} · {order.user.email} ·{" "}
              {format(new Date(order.createdAt), "PPP p")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {getOrderStatusLabel(order.orderStatus)}
            </Badge>
            <PaymentStatusBadge
              status={order.paymentStatus}
              provider={order.payments[0]?.provider}
            />
            <AdminOrderCancelButton
              orderId={order.id}
              orderStatus={order.orderStatus}
            />
          </div>
        </div>
        {sellerIds.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {sellerIds.map((sellerId) => (
              <form
                key={sellerId}
                action={async () => {
                  "use server";
                  await setViewAsSeller(sellerId, "/seller/orders");
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-[#8b2e2e] hover:bg-[#8b2e2e]/5"
                >
                  Open seller orders
                </button>
              </form>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border-b pb-4 last:border-0"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.thumbnail ? (
                    <Image
                      src={item.product.thumbnail}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU {item.sku}
                    {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                  </div>
                  {item.product.seller?.businessName ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Seller: {item.product.seller.businessName}
                    </div>
                  ) : null}
                  <div className="mt-1 text-sm">
                    Qty {item.quantity} × {formatCurrency(Number(item.price))}
                  </div>
                </div>
                <div className="font-semibold">
                  {formatCurrency(Number(item.total))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>{formatCurrency(Number(order.discount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(Number(order.shippingFee))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(Number(order.tax))}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
              {order.couponCode ? (
                <p className="text-muted-foreground">
                  Coupon: {order.couponCode}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6">
              <div className="font-medium">{shipping.name}</div>
              <div>{shipping.addressLine1}</div>
              {shipping.addressLine2 ? <div>{shipping.addressLine2}</div> : null}
              <div>
                {shipping.city}, {shipping.state} {shipping.postalCode}
              </div>
              <div>{shipping.phone}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {order.payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <div className="font-medium">{payment.provider}</div>
                  <div className="text-muted-foreground">
                    {payment.transactionId || "No transaction id"}
                  </div>
                  {payment.providerPaymentId ? (
                    <div className="text-xs text-muted-foreground">
                      Pay ID: {payment.providerPaymentId}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatCurrency(Number(payment.amount))}
                  </div>
                  <Badge variant="outline">{payment.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {order.shipments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.shipments.map((shipment) => (
              <div
                key={shipment.id}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="font-medium">
                  {shipment.courier || "Courier"} ·{" "}
                  {shipment.trackingNumber || "No tracking yet"}
                </div>
                <div className="mt-1 text-muted-foreground">
                  {shipment.shippedAt
                    ? `Shipped ${format(new Date(shipment.shippedAt), "PPP p")}`
                    : "Not shipped"}
                  {shipment.deliveredAt
                    ? ` · Delivered ${format(new Date(shipment.deliveredAt), "PPP p")}`
                    : ""}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {order.statusHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Status history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.statusHistory.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b pb-3 text-sm last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {getOrderStatusLabel(row.status)}
                  </div>
                  {row.note ? (
                    <div className="text-muted-foreground">{row.note}</div>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(row.createdAt), "dd MMM yyyy, p")}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
              {order.orderNumber}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {order.user.name} • {format(new Date(order.createdAt), "PPP p")}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">
              {getOrderStatusLabel(order.orderStatus)}
            </Badge>
            <PaymentStatusBadge
              status={order.paymentStatus}
              provider={order.payments[0]?.provider}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.product.thumbnail ? (
                    <Image
                      src={item.product.thumbnail}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      📦
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU {item.sku}
                    {item.variantLabel ? ` • ${item.variantLabel}` : ""}
                  </div>
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
                <p className="text-muted-foreground">Coupon: {order.couponCode}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
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

      {order.payments.length > 0 && (
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
      )}
    </div>
  );
}

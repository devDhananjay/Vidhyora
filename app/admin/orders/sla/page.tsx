import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  DEFAULT_SLA_DAYS,
  daysSince,
  findDelayedOrders,
} from "@/lib/orders/sla";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Order SLA | Super Admin",
};

export default async function AdminOrderSlaPage() {
  await requireAdmin();
  const orders = await findDelayedOrders(DEFAULT_SLA_DAYS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Order SLA
        </h1>
        <p className="mt-2 text-muted-foreground">
          Orders still in Ordered / Confirmed / Packed for more than{" "}
          {DEFAULT_SLA_DAYS} days. {orders.length} delayed.
        </p>
        <Link
          href="/admin/orders"
          className="mt-2 inline-block text-sm text-primary hover:underline"
        >
          ← All orders
        </Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No delayed orders. Nice work.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex gap-3">
                    {order.items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        {item.product.thumbnail ? (
                          <Image
                            src={item.product.thumbnail}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xl">
                            📦
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.user.name} • {order.user.email}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Placed {format(order.createdAt, "MMM dd, yyyy")} •{" "}
                          {daysSince(order.createdAt)} days ago
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="destructive">
                          {getOrderStatusLabel(order.orderStatus)}
                        </Badge>
                        <Badge variant="outline">
                          {formatCurrency(Number(order.total))}
                        </Badge>
                      </div>
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="mt-3 inline-block text-sm text-primary hover:underline"
                    >
                      Open order →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

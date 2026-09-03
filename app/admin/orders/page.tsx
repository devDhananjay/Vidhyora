import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllOrders } from "@/actions/admin/get-orders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Orders | Super Admin",
};

function paymentBadge(status: string) {
  if (status === "PAID") return <Badge className="bg-green-600">Paid</Badge>;
  if (status === "FAILED") return <Badge variant="destructive">Failed</Badge>;
  if (status === "REFUNDED") return <Badge variant="outline">Refunded</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  const pending = orders.filter((order) =>
    ["ORDERED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(
      order.orderStatus,
    ),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Orders</h1>
        <p className="mt-2 text-muted-foreground">
          {orders.length} total orders • {pending} in progress
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders yet.
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
                          {order.items
                            .map((item) => `${item.productName} × ${item.quantity}`)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {getOrderStatusLabel(order.orderStatus)}
                        </Badge>
                        {paymentBadge(order.paymentStatus)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-semibold">
                          {formatCurrency(Number(order.total))}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Items</div>
                        <div className="font-medium">{order.items.length}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Placed</div>
                        <div className="font-medium">
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
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

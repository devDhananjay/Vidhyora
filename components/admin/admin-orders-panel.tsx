"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { FilteredList } from "@/components/dashboard/filtered-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { formatCurrency } from "@/lib/utils";
import { getOrderStatusLabel } from "@/lib/orders/order-utils";

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number | string;
  createdAt: string | Date;
  user: { name: string | null; email: string };
  payments: Array<{ provider: string }>;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    product: { thumbnail: string | null };
  }>;
};

const IN_PROGRESS = new Set([
  "ORDERED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
]);

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
  { id: "RETURNED", label: "Returned" },
];

function matchFilter(item: AdminOrderListItem, filterId: string) {
  if (filterId === "in_progress") return IN_PROGRESS.has(item.orderStatus);
  return item.orderStatus === filterId;
}

function searchText(item: AdminOrderListItem) {
  return [
    item.orderNumber,
    item.user.name,
    item.user.email,
    item.orderStatus,
    item.paymentStatus,
    ...item.items.map((i) => i.productName),
  ]
    .filter(Boolean)
    .join(" ");
}

export function AdminOrdersPanel({ orders }: { orders: AdminOrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No orders yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <FilteredList
      items={orders}
      filters={FILTERS}
      matchFilter={matchFilter}
      searchText={searchText}
      searchPlaceholder="Search order, customer, product…"
      emptyLabel="No orders match this filter."
    >
      {(rows) => (
        <div className="grid gap-4">
          {rows.map((order) => (
            <Card
              key={order.id}
              className="border-[#ead9c4]/80 transition hover:border-[#d4b896]"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <div className="flex gap-3">
                    {order.items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f6ead7]"
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
                          className="font-semibold hover:text-[#8b2e2e]"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.user.name} · {order.user.email}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {order.items
                            .map(
                              (item) =>
                                `${item.productName} × ${item.quantity}`,
                            )
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className="border-[#ead9c4] bg-[#faf6f0]"
                        >
                          {getOrderStatusLabel(order.orderStatus)}
                        </Badge>
                        <PaymentStatusBadge
                          status={order.paymentStatus}
                          provider={order.payments[0]?.provider}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-serif text-xl text-brand">
                          {formatCurrency(Number(order.total))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Items</div>
                        <div className="font-medium">{order.items.length}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Placed</div>
                        <div className="font-medium">
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-end">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-sm font-medium text-[#8b2e2e] hover:underline"
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
    </FilteredList>
  );
}

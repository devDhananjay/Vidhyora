"use client";

import { OrderCard } from "@/components/orders/order-card";
import { OrdersSearch } from "@/components/orders/orders-search";
import type { OrderWithDetails } from "@/types/order";

type BuyerOrdersPanelProps = {
  orders: OrderWithDetails[];
};

export function BuyerOrdersPanel({ orders }: BuyerOrdersPanelProps) {
  const searchable = orders.map((order) => ({
    ...order,
    searchText: [
      order.orderNumber,
      ...order.items.map((item) => item.productName),
    ].join(" "),
  }));

  return (
    <OrdersSearch
      items={searchable}
      placeholder="Search by order number or product…"
    >
      {(filtered) => (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </OrdersSearch>
  );
}

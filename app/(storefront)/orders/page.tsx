import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getUserOrders } from "@/actions/orders/get-orders";
import { OrderCard } from "@/components/orders/order-card";
import { EmptyOrders } from "@/components/orders/empty-orders";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "My Orders | VIDYORA",
  description: "Track and manage your orders",
};

export default async function OrdersPage() {
  const orders = await getUserOrders();

  if (orders.length === 0) {
    return <EmptyOrders />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="size-8" />
        <div>
          <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">My Orders</h1>
          <p className="text-muted-foreground">
            Track, return, or buy things again
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

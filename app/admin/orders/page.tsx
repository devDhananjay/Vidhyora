import type { Metadata } from "next";
import Link from "next/link";
import { getAllOrders } from "@/actions/admin/get-orders";
import { AdminOrdersPanel } from "@/components/admin/admin-orders-panel";

export const metadata: Metadata = {
  title: "Orders | Admin",
};

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
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Orders
        </h1>
        <p className="mt-2 text-muted-foreground">
          {orders.length} total · {pending} in progress.{" "}
          <Link
            href="/admin/orders/sla"
            className="font-medium text-[#8b2e2e] hover:underline"
          >
            View Order SLA →
          </Link>
        </p>
      </div>

      <AdminOrdersPanel orders={orders} />
    </div>
  );
}

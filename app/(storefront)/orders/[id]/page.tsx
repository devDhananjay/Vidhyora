import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getOrderById } from "@/actions/orders/get-orders";
import { OrderDetailHeader } from "@/components/orders/order-detail-header";
import { OrderItems } from "@/components/orders/order-items";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { OrderActions } from "@/components/orders/order-actions";
import { OrderTrackingCard } from "@/components/orders/order-tracking-card";

export const metadata: Metadata = {
  title: "Order Details | VIDYORA",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OrderDetailHeader order={order} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <OrderItems items={order.items} orderStatus={order.orderStatus} />
          <OrderTrackingCard shipments={order.shipments ?? []} />
          <OrderTimeline orderId={order.id} currentStatus={order.orderStatus} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <OrderSummaryCard order={order} />
          <div className="rounded-lg border p-6">
            <h3 className="mb-4 font-semibold">Documents</h3>
            <Link
              href={`/orders/${order.id}/invoice`}
              className="inline-flex rounded-full border border-[#8b2e2e]/30 px-4 py-2 text-sm text-[#8b2e2e] hover:bg-[#8b2e2e]/5"
            >
              View / print invoice
            </Link>
          </div>
          <OrderActions order={order} />
        </div>
      </div>
    </div>
  );
}

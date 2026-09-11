import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { getSellerOrders } from "@/actions/seller/get-orders";
import { getActingSeller } from "@/lib/seller-context";
import prisma from "@/lib/prisma";
import {
  SellerOrdersPanel,
  type SellerOrderListItem,
} from "@/components/seller/seller-orders-panel";

export const metadata: Metadata = {
  title: "Orders | Seller Dashboard",
};

function toSellerOrderListItem(item: Awaited<ReturnType<typeof getSellerOrders>>[number]): SellerOrderListItem {
  return {
    id: item.id,
    quantity: item.quantity,
    total: Number(item.total),
    order: {
      orderNumber: item.order.orderNumber,
      orderStatus: item.order.orderStatus,
      paymentStatus: item.order.paymentStatus,
      createdAt:
        item.order.createdAt instanceof Date
          ? item.order.createdAt.toISOString()
          : String(item.order.createdAt),
      user: {
        name: item.order.user.name,
        email: item.order.user.email,
      },
      payments: item.order.payments.map((p) => ({ provider: p.provider })),
    },
    product: {
      name: item.product.name,
      thumbnail: item.product.thumbnail,
      slug: item.product.slug,
    },
    variant: {
      sku: item.variant.sku,
      attributes: item.variant.attributes,
    },
  };
}

export default async function SellerOrdersPage() {
  const [orderItems, acting] = await Promise.all([
    getSellerOrders(),
    getActingSeller(),
  ]);
  const profile = acting
    ? await prisma.sellerProfile.findUnique({
        where: { sellerId: acting.sellerUserId },
        select: { preferredCourier: true },
      })
    : null;
  const preferredCourier = profile?.preferredCourier || "";
  const items = orderItems.map(toSellerOrderListItem);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Orders
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {items.length} {items.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-6xl">📦</div>
            <h3 className="mb-2 text-lg font-semibold">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders will appear here when customers purchase your products
            </p>
          </CardContent>
        </Card>
      ) : (
        <SellerOrdersPanel
          items={items}
          preferredCourier={preferredCourier}
        />
      )}
    </div>
  );
}

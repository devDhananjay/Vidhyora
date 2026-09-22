import type { Metadata } from "next";
import { getUserOrders } from "@/actions/orders/get-orders";
import { AccountBackLink } from "@/components/account/account-back-link";
import { EmptyOrders } from "@/components/orders/empty-orders";
import { BuyerOrdersPanel } from "@/components/orders/buyer-orders-panel";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "My Orders | VIDYORA",
  description: "Track and manage your orders",
};

export default async function OrdersPage() {
  const orders = await getUserOrders();

  if (orders.length === 0) {
    return (
      <div className="bg-[#faf8f6]">
        <div className="container mx-auto px-4 py-8">
          <AccountBackLink />
          <EmptyOrders />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f6]">
      <div className="container mx-auto px-4 py-8">
        <AccountBackLink />
        <div className="mb-6 flex items-center gap-3">
          <ShoppingBag className="size-8 text-[#8b2e2e]" />
          <div>
            <h1 className="font-serif text-3xl text-brand sm:text-4xl">
              My Orders
            </h1>
            <p className="text-muted-foreground">
              Track, return, or buy things again
            </p>
          </div>
        </div>

        <BuyerOrdersPanel orders={orders} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AddressSelection } from "@/components/checkout/address-selection";
import { OrderReview } from "@/components/checkout/order-review";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import type { Address } from "@prisma/client";
import type { CartWithItems } from "@/types/cart";
import type { CartSummary } from "@/types/cart";

type ClientCheckoutProps = {
  addresses: Address[];
  cart: CartWithItems;
  summary: CartSummary;
};

export function ClientCheckout({
  addresses,
  cart,
  summary,
}: ClientCheckoutProps) {
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
  );

  const activeItems = cart.items.filter((item) => !item.savedForLater);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      {/* Main Checkout Content */}
      <div className="lg:col-span-2 space-y-8">
        {/* Step 1: Delivery Address */}
        <AddressSelection
          addresses={addresses}
          onAddressSelect={setSelectedAddressId}
        />

        {/* Step 2: Order Review */}
        <OrderReview items={activeItems} />
      </div>

      {/* Order Summary Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <CheckoutSummary
            summary={summary}
            itemCount={activeItems.length}
            selectedAddressId={selectedAddressId}
          />
        </div>
      </div>
    </div>
  );
}

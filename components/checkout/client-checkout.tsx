"use client";

import { useState } from "react";
import { AddressSelection } from "@/components/checkout/address-selection";
import { OrderReview } from "@/components/checkout/order-review";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import {
  GuestAddressForm,
  type GuestAddressDraft,
} from "@/components/checkout/guest-address-form";
import type { Address } from "@prisma/client";
import type { CartWithItems } from "@/types/cart";
import type { CartSummary } from "@/types/cart";

type ClientCheckoutProps = {
  addresses: Address[];
  cart: CartWithItems;
  summary: CartSummary;
  codEnabled?: boolean;
  giftNotesEnabled?: boolean;
  isGuest?: boolean;
};

const emptyGuest: GuestAddressDraft = {
  fullName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

export function ClientCheckout({
  addresses,
  cart,
  summary,
  codEnabled = true,
  giftNotesEnabled = true,
  isGuest = false,
}: ClientCheckoutProps) {
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
  );
  const [guestAddress, setGuestAddress] = useState<GuestAddressDraft>(emptyGuest);

  const activeItems = cart.items.filter((item) => !item.savedForLater);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        {isGuest || addresses.length === 0 ? (
          <GuestAddressForm value={guestAddress} onChange={setGuestAddress} />
        ) : (
          <AddressSelection
            addresses={addresses}
            onAddressSelect={setSelectedAddressId}
          />
        )}

        <OrderReview items={activeItems} />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <CheckoutSummary
            summary={summary}
            cart={cart}
            itemCount={activeItems.length}
            selectedAddressId={
              isGuest || addresses.length === 0 ? undefined : selectedAddressId
            }
            guestAddress={
              isGuest || addresses.length === 0 ? guestAddress : undefined
            }
            addresses={addresses.map((address) => ({
              id: address.id,
              postalCode: address.postalCode,
            }))}
            codEnabled={codEnabled}
            giftNotesEnabled={giftNotesEnabled}
          />
        </div>
      </div>
    </div>
  );
}

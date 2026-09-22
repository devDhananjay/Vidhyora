"use client";

import { useTransition } from "react";
import { AddressAutocomplete } from "@/components/address/address-autocomplete";
import { lookupAddressByPincode } from "@/actions/maps/google-places";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export type GuestAddressDraft = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  lat?: number | null;
  lng?: number | null;
};

type GuestAddressFormProps = {
  value: GuestAddressDraft;
  onChange: (next: GuestAddressDraft) => void;
};

export function GuestAddressForm({ value, onChange }: GuestAddressFormProps) {
  const [pinPending, startPin] = useTransition();

  function patch(partial: Partial<GuestAddressDraft>) {
    onChange({ ...value, ...partial });
  }

  function fillFromPin(raw: string) {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    patch({ postalCode: pin });
    if (pin.length !== 6) return;
    startPin(async () => {
      const result = await lookupAddressByPincode(pin);
      if (!result.success) return;
      patch({
        postalCode: result.data.postalCode || pin,
        city: result.data.city || value.city,
        state: result.data.state || value.state,
        lat: result.data.lat,
        lng: result.data.lng,
      });
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="font-serif text-xl text-brand">Guest checkout</h2>
        <p className="mt-1 text-sm text-neutral-500">
          No account needed. We will email your order confirmation.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="guestFullName">Full name</Label>
          <Input
            id="guestFullName"
            value={value.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
            className="mt-1.5"
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="guestEmail">Email</Label>
          <Input
            id="guestEmail"
            type="email"
            value={value.email}
            onChange={(e) => patch({ email: e.target.value })}
            className="mt-1.5"
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="guestPhone">Phone</Label>
          <Input
            id="guestPhone"
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            className="mt-1.5"
            autoComplete="tel"
          />
        </div>

        <div className="sm:col-span-2">
          <AddressAutocomplete
            value={value.line1}
            onChange={(line1) => patch({ line1 })}
            onResolved={(place) => {
              const pin = (place.postalCode || "").replace(/\D/g, "").slice(0, 6);
              patch({
                line1: place.line1 || value.line1,
                city: place.city || value.city,
                state: place.state || value.state,
                postalCode: pin.length === 6 ? pin : value.postalCode,
                lat: place.lat,
                lng: place.lng,
              });
            }}
            label="Address line 1"
            placeholder="Search building, street or landmark"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="guestLine2">Address line 2 (optional)</Label>
          <Input
            id="guestLine2"
            value={value.line2}
            onChange={(e) => patch({ line2: e.target.value })}
            className="mt-1.5"
            autoComplete="address-line2"
          />
        </div>
        <div>
          <Label htmlFor="guestPostalCode">Pincode</Label>
          <div className="relative mt-1.5">
            <Input
              id="guestPostalCode"
              value={value.postalCode}
              onChange={(e) => fillFromPin(e.target.value)}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={6}
              placeholder="Auto-filled — editable"
            />
            {pinPending ? (
              <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-neutral-400" />
            ) : null}
          </div>
        </div>
        <div>
          <Label htmlFor="guestCity">City</Label>
          <Input
            id="guestCity"
            value={value.city}
            onChange={(e) => patch({ city: e.target.value })}
            className="mt-1.5"
            autoComplete="address-level2"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="guestState">State</Label>
          <Input
            id="guestState"
            value={value.state}
            onChange={(e) => patch({ state: e.target.value })}
            className="mt-1.5"
            autoComplete="address-level1"
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type GuestAddressDraft = {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

type GuestAddressFormProps = {
  value: GuestAddressDraft;
  onChange: (next: GuestAddressDraft) => void;
};

export function GuestAddressForm({ value, onChange }: GuestAddressFormProps) {
  function patch(partial: Partial<GuestAddressDraft>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="font-serif text-xl text-neutral-900">Guest checkout</h2>
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
          <Label htmlFor="guestLine1">Address line 1</Label>
          <Input
            id="guestLine1"
            value={value.line1}
            onChange={(e) => patch({ line1: e.target.value })}
            className="mt-1.5"
            autoComplete="address-line1"
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
          <Label htmlFor="guestCity">City</Label>
          <Input
            id="guestCity"
            value={value.city}
            onChange={(e) => patch({ city: e.target.value })}
            className="mt-1.5"
            autoComplete="address-level2"
          />
        </div>
        <div>
          <Label htmlFor="guestState">State</Label>
          <Input
            id="guestState"
            value={value.state}
            onChange={(e) => patch({ state: e.target.value })}
            className="mt-1.5"
            autoComplete="address-level1"
          />
        </div>
        <div>
          <Label htmlFor="guestPostalCode">Pincode</Label>
          <Input
            id="guestPostalCode"
            value={value.postalCode}
            onChange={(e) => patch({ postalCode: e.target.value })}
            className="mt-1.5"
            autoComplete="postal-code"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
}

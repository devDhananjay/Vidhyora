"use client";

import { useState } from "react";
import type { Address } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { AddressCard } from "@/components/checkout/address-card";
import { AddressForm } from "@/components/checkout/address-form";

type AddressSelectionProps = {
  addresses: Address[];
  onAddressSelect?: (addressId: string) => void;
};

export function AddressSelection({
  addresses,
  onAddressSelect,
}: AddressSelectionProps) {
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
  );

  const handleSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    onAddressSelect?.(addressId);
  };

  return (
    <div className="rounded-lg border p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-primary" />
          <h2 className="text-lg font-semibold">Delivery Address</h2>
        </div>
        {!showForm && addresses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setShowForm(true)}
          >
            <Plus className="mr-2 size-4" />
            Add New Address
          </Button>
        )}
      </div>

      {showForm ? (
        <div>
          <AddressForm onSuccess={() => setShowForm(false)} />
          {addresses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="mt-4"
            >
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={address.id === selectedAddressId}
              onSelect={() => handleSelect(address.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

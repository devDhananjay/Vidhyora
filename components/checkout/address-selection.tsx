"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@prisma/client";
import { MapPin, Plus } from "lucide-react";
import { AddressFormSheet } from "@/components/address/address-form-sheet";
import { AddressCard } from "@/components/checkout/address-card";
import { Button } from "@/components/ui/button";

type AddressSelectionProps = {
  addresses: Address[];
  onAddressSelect?: (addressId: string) => void;
};

export function AddressSelection({
  addresses,
  onAddressSelect,
}: AddressSelectionProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
  );

  useEffect(() => {
    const stillExists = addresses.some((a) => a.id === selectedAddressId);
    if (!stillExists) {
      const next =
        addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || undefined;
      setSelectedAddressId(next);
      if (next) onAddressSelect?.(next);
    }
  }, [addresses, selectedAddressId, onAddressSelect]);

  const handleSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    onAddressSelect?.(addressId);
  };

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setSheetOpen(true);
  }

  function handleSuccess() {
    router.refresh();
  }

  return (
    <div className="rounded-xl border p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 shrink-0 text-primary" />
          <h2 className="text-lg font-semibold">Delivery Address</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={openAdd}
        >
          <Plus className="mr-2 size-4" />
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Add a delivery address to continue checkout.
          </p>
          <Button type="button" className="mt-4" onClick={openAdd}>
            <Plus className="mr-2 size-4" />
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={address.id === selectedAddressId}
              onSelect={() => handleSelect(address.id)}
              onEdit={() => openEdit(address)}
            />
          ))}
        </div>
      )}

      <AddressFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditing(null);
        }}
        address={editing}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

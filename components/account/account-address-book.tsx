"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Address } from "@prisma/client";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { deleteAddress } from "@/actions/address/delete-address";
import { setDefaultAddress } from "@/actions/address/set-default-address";
import { AddressFormSheet } from "@/components/address/address-form-sheet";
import { Button } from "@/components/ui/button";

type AccountAddressBookProps = {
  addresses: Address[];
  onNestedChange?: (nested: boolean) => void;
};

export function AccountAddressBook({
  addresses,
}: AccountAddressBookProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
    setError(null);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setSheetOpen(true);
    setError(null);
  }

  function handleSheetChange(open: boolean) {
    setSheetOpen(open);
    if (!open) setEditing(null);
  }

  function refresh() {
    router.refresh();
  }

  function onDelete(addressId: string) {
    if (!confirm("Delete this address?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAddress(addressId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh();
    });
  }

  function onSetDefault(addressId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setDefaultAddress(addressId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {addresses.length === 0
            ? "No saved addresses yet."
            : `${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`}
        </p>
        <Button
          type="button"
          className="gap-2 rounded-full"
          onClick={openAdd}
        >
          <Plus className="size-4" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-10 text-center">
          <MapPin className="mx-auto size-8 text-[#8b2e2e]" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-neutral-600">
            Add a delivery address for faster checkout.
          </p>
          <Button
            type="button"
            className="mt-4 gap-2 rounded-full"
            onClick={openAdd}
          >
            <Plus className="size-4" />
            Add address
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-2xl border border-neutral-200 bg-[#faf8f6] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-neutral-900">{address.name}</p>
                    <span className="rounded-full bg-neutral-200/80 px-2.5 py-0.5 text-xs font-medium uppercase text-neutral-700">
                      {(address as { label?: string }).label === "WORK"
                        ? "Work"
                        : (address as { label?: string }).label === "OTHER"
                          ? "Other"
                          : "Home"}
                    </span>
                    {address.isDefault ? (
                      <span className="rounded-full bg-[#8b2e2e]/10 px-2.5 py-0.5 text-xs font-medium text-[#8b2e2e]">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-0.5 text-sm text-neutral-600">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                    {address.landmark ? (
                      <p>Landmark: {address.landmark}</p>
                    ) : null}
                    <p>
                      {address.city}, {address.state} - {address.postalCode}
                    </p>
                    <p className="pt-1 text-neutral-800">
                      Phone: {address.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 rounded-full"
                      disabled={isPending}
                      onClick={() => onSetDefault(address.id)}
                    >
                      <Star className="size-3.5" />
                      Default
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full"
                    disabled={isPending}
                    onClick={() => openEdit(address)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full text-red-600 hover:text-red-700"
                    disabled={isPending}
                    onClick={() => onDelete(address.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddressFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        address={editing}
        onSuccess={refresh}
      />
    </div>
  );
}

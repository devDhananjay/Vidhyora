"use client";

import type { Address } from "@prisma/client";
import { AccountAddressForm } from "@/components/account/account-address-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AddressFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
  onSuccess?: () => void;
};

export function AddressFormSheet({
  open,
  onOpenChange,
  address = null,
  onSuccess,
}: AddressFormSheetProps) {
  const isEdit = Boolean(address);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "fixed inset-y-0 right-0 left-auto top-0 z-[101] flex h-dvh max-h-dvh w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-y-0 border-l border-r-0 p-0 shadow-2xl sm:rounded-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
          "sm:max-w-xl",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-100 px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="font-serif text-2xl font-normal tracking-normal">
            {isEdit ? "Edit address" : "Add address"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your delivery details. The map updates when you change PIN or city."
              : "Fill in your delivery details. The map updates when you enter PIN or city."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <AccountAddressForm
            key={address?.id ?? "new"}
            address={address}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

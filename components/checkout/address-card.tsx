import type { Address } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type AddressCardProps = {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
};

export function AddressCard({ address, isSelected, onSelect }: AddressCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full rounded-lg border p-4 text-left transition-colors hover:border-primary",
        isSelected && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            isSelected
              ? "border-primary bg-primary"
              : "border-muted-foreground/50",
          )}
        >
          {isSelected && <Check className="size-3 text-primary-foreground" />}
        </div>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">{address.name}</span>
            {address.isDefault && (
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Default
              </span>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p>{address.addressLine1}</p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            {address.landmark && <p>Landmark: {address.landmark}</p>}
            <p>
              {address.city}, {address.state} - {address.postalCode}
            </p>
            <p className="mt-1 font-medium text-foreground">
              Phone: {address.phone}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

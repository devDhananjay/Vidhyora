import type { Address } from "@prisma/client";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AddressCardProps = {
  address: Address;
  isSelected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
};

export function AddressCard({
  address,
  isSelected,
  onSelect,
  onEdit,
}: AddressCardProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-xl border p-4 text-left transition-colors",
        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/60",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-pressed={isSelected}
        >
          <div
            className={cn(
              "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
              isSelected
                ? "border-primary bg-primary"
                : "border-muted-foreground/50",
            )}
          >
            {isSelected && (
              <Check className="size-3 text-primary-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-medium">{address.name}</span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium uppercase text-neutral-700">
                {(address as { label?: string }).label === "WORK"
                  ? "Work"
                  : (address as { label?: string }).label === "OTHER"
                    ? "Other"
                    : "Home"}
              </span>
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
        </button>

        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : null}
      </div>
    </div>
  );
}

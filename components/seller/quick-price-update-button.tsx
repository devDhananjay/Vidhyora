"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Pencil } from "lucide-react";
import { updateSellerProductPricing } from "@/actions/seller/manage-products";
import { appAlert } from "@/components/shared/app-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type QuickPriceUpdateButtonProps = {
  productId: string;
  productName: string;
  sellingPrice: number;
  compareAtPrice: number | null;
};

export function QuickPriceUpdateButton({
  productId,
  productName,
  sellingPrice,
  compareAtPrice,
}: QuickPriceUpdateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [price, setPrice] = useState(String(sellingPrice));
  const [mrp, setMrp] = useState(
    compareAtPrice != null && compareAtPrice > 0 ? String(compareAtPrice) : "",
  );

  function resetFields() {
    setPrice(String(sellingPrice));
    setMrp(
      compareAtPrice != null && compareAtPrice > 0 ? String(compareAtPrice) : "",
    );
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) resetFields();
  }

  function onSave() {
    const selling = Number(price);
    const compare = mrp.trim() === "" ? null : Number(mrp);

    if (!Number.isFinite(selling) || selling <= 0) {
      void appAlert("Enter a valid selling price.", { variant: "error" });
      return;
    }
    if (compare != null && (!Number.isFinite(compare) || compare <= 0)) {
      void appAlert("Enter a valid compare-at / MRP, or leave it blank.", {
        variant: "error",
      });
      return;
    }
    if (compare != null && compare < selling) {
      void appAlert("Compare-at / MRP must be ≥ selling price.", {
        variant: "error",
      });
      return;
    }

    startTransition(async () => {
      const result = await updateSellerProductPricing(
        productId,
        selling,
        compare,
      );
      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }
      // Close price dialog before success alert — stacked modals block OK clicks.
      setOpen(false);
      router.refresh();
      await appAlert("Price updated.", { variant: "success" });
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-[#ead9c4]"
        >
          <Pencil className="size-3.5" />
          Update price
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-normal text-brand">
            Update price
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {productName}
            <span className="mt-1 block text-neutral-500">
              Current selling price {formatCurrency(sellingPrice)}
              {compareAtPrice != null && compareAtPrice > 0
                ? ` · MRP ${formatCurrency(compareAtPrice)}`
                : ""}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="space-y-2">
            <Label htmlFor={`selling-${productId}`}>Selling price (₹)</Label>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id={`selling-${productId}`}
                type="number"
                min={1}
                step="1"
                inputMode="numeric"
                className="pl-9"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`mrp-${productId}`}>
              Compare-at / MRP (₹){" "}
              <span className="font-normal text-neutral-400">(optional)</span>
            </Label>
            <div className="relative">
              <IndianRupee className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id={`mrp-${productId}`}
                type="number"
                min={1}
                step="1"
                inputMode="numeric"
                className="pl-9"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                disabled={isPending}
                placeholder="Leave blank for none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Updates this listing&apos;s selling price and MRP on all active
              variants.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#8b2e2e] hover:bg-[#6f2424]"
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Save price"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

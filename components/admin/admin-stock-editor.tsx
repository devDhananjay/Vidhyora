"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAdminVariantStock } from "@/actions/admin/manage-inventory";

export function AdminStockEditor({
  variantId,
  stock,
}: {
  variantId: string;
  stock: number;
}) {
  const [value, setValue] = useState(String(stock));
  const [isPending, startTransition] = useTransition();

  const save = () => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      alert("Stock must be a whole number of 0 or more");
      return;
    }
    startTransition(async () => {
      const result = await updateAdminVariantStock(variantId, next);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-9 w-24"
      />
      <Button
        type="button"
        variant="outline"
        onClick={save}
        disabled={isPending || value === String(stock)}
      >
        {isPending ? "Saving..." : "Update"}
      </Button>
    </div>
  );
}

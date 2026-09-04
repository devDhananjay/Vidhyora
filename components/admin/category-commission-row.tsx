"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateCategoryCommission } from "@/actions/admin/manage-commission";

export function CategoryCommissionRow({
  categoryId,
  name,
  currentRate,
}: {
  categoryId: string;
  name: string;
  currentRate: number | null;
}) {
  const [rate, setRate] = useState(
    currentRate == null ? "" : String(currentRate),
  );
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateCategoryCommission(categoryId, rate);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3 last:border-0">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          Empty = use each seller admin&apos;s own rate
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          step="0.1"
          placeholder="Seller rate"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          className="w-28"
        />
        <span className="text-sm text-muted-foreground">%</span>
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

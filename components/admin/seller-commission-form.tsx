"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSellerCommission } from "@/actions/admin/manage-commission";

export function SellerCommissionForm({
  sellerId,
  currentRate,
}: {
  sellerId: string;
  currentRate: number;
}) {
  const [rate, setRate] = useState(String(currentRate));
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateSellerCommission(sellerId, rate);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="seller-commission">Commission %</Label>
        <Input
          id="seller-commission"
          type="number"
          min={0}
          max={100}
          step="0.1"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          className="w-28"
        />
      </div>
      <Button
        type="button"
        onClick={save}
        disabled={isPending}
        className="bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {isPending ? "Saving..." : "Save rate"}
      </Button>
    </div>
  );
}

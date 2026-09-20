"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  JEWELLERY_QA_ITEMS,
  type JewelleryQaChecklist,
  type JewelleryQaItemId,
} from "@/lib/products/jewellery-qa";
import { saveProductQaChecklist } from "@/actions/admin/manage-products";
import { appAlert } from "@/components/shared/app-dialog";
import { cn } from "@/lib/utils";

type JewelleryQaChecklistPanelProps = {
  productId: string;
  initial?: JewelleryQaChecklist | null;
  disabled?: boolean;
};

export function JewelleryQaChecklistPanel({
  productId,
  initial,
  disabled,
}: JewelleryQaChecklistPanelProps) {
  const [checked, setChecked] = useState<
    Partial<Record<JewelleryQaItemId, boolean>>
  >(initial?.checked ?? {});
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  const criticalMissing = useMemo(
    () =>
      JEWELLERY_QA_ITEMS.filter((item) => item.critical && !checked[item.id]),
    [checked],
  );

  const allCriticalOk = criticalMissing.length === 0;

  const toggle = (id: JewelleryQaItemId) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveProductQaChecklist(productId, {
        checked,
        notes: notes.trim() || undefined,
      });
      if (result.success) {
        await appAlert("QA checklist saved.", { variant: "success" });
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#e8d5d0] bg-[#faf7f5] p-4">
      <div>
        <h3 className="font-semibold text-neutral-900">Jewellery QA checklist</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional review aid — tick items as you check the listing. Does not block approve.
        </p>
      </div>

      <ul className="space-y-2.5">
        {JEWELLERY_QA_ITEMS.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <Checkbox
              id={`qa-${item.id}`}
              checked={Boolean(checked[item.id])}
              disabled={disabled || isPending}
              onCheckedChange={() => toggle(item.id)}
              className="mt-0.5"
            />
            <Label
              htmlFor={`qa-${item.id}`}
              className={cn(
                "cursor-pointer text-sm font-normal leading-snug",
                item.critical && "font-medium",
              )}
            >
              {item.label}
              {item.critical ? (
                <span className="ml-1 text-[11px] text-[#8b2e2e]">Required</span>
              ) : null}
            </Label>
          </li>
        ))}
      </ul>

      <div>
        <Label htmlFor="qa-notes" className="text-sm">
          Internal notes
        </Label>
        <Textarea
          id="qa-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || isPending}
          placeholder="Optional notes for other admins…"
          className="mt-1.5 min-h-[72px]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          className={cn(
            "text-xs",
            allCriticalOk ? "text-emerald-700" : "text-amber-700",
          )}
        >
          {allCriticalOk
            ? "All critical checks passed"
            : `${criticalMissing.length} critical item(s) still open`}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={disabled || isPending}
          className="bg-[#8b2e2e] hover:bg-[#6f2424]"
        >
          {isPending ? "Saving…" : "Save checklist"}
        </Button>
      </div>
    </div>
  );
}

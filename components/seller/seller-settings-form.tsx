"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSellerSettings } from "@/actions/seller/update-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  businessPhone: string;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  preferredCourier: string;
  processingDays: number;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  bankName: string;
};

export function SellerSettingsForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(props);

  function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateSellerSettings({
        ...form,
        bankIfscCode: form.bankIfscCode.toUpperCase(),
        processingDays: Number(form.processingDays) || 2,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="biz-phone">Business phone</Label>
          <Input
            id="biz-phone"
            value={form.businessPhone}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessPhone: e.target.value }))
            }
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="courier">Preferred courier</Label>
          <Input
            id="courier"
            value={form.preferredCourier}
            onChange={(e) =>
              setForm((f) => ({ ...f, preferredCourier: e.target.value }))
            }
            placeholder="Bluedart / Delhivery"
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="days">Processing days</Label>
          <Input
            id="days"
            type="number"
            min={1}
            max={14}
            value={form.processingDays}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                processingDays: Number(e.target.value) || 2,
              }))
            }
            className="rounded-full"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.notifyNewOrders}
            onChange={(e) =>
              setForm((f) => ({ ...f, notifyNewOrders: e.target.checked }))
            }
          />
          Email me on new orders
        </label>
        <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.notifyLowStock}
            onChange={(e) =>
              setForm((f) => ({ ...f, notifyLowStock: e.target.checked }))
            }
          />
          Email me on low stock
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Account holder</Label>
          <Input
            value={form.bankAccountHolder}
            onChange={(e) =>
              setForm((f) => ({ ...f, bankAccountHolder: e.target.value }))
            }
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Bank name</Label>
          <Input
            value={form.bankName}
            onChange={(e) =>
              setForm((f) => ({ ...f, bankName: e.target.value }))
            }
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label>Account number</Label>
          <Input
            value={form.bankAccountNumber}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bankAccountNumber: e.target.value.replace(/\D/g, ""),
              }))
            }
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label>IFSC</Label>
          <Input
            value={form.bankIfscCode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bankIfscCode: e.target.value.toUpperCase(),
              }))
            }
            className="rounded-full"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="rounded-full px-6">
        {isPending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

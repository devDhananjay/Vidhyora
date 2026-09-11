"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveSiteSettings } from "@/actions/admin/manage-site-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  CommerceSettings,
  SiteSettingsData,
} from "@/lib/validations/site-settings";
import { DEFAULT_COMMERCE_SETTINGS } from "@/lib/validations/site-settings";

type CommerceSettingsFormProps = {
  initialData: SiteSettingsData;
};

export function CommerceSettingsForm({ initialData }: CommerceSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [commerce, setCommerce] = useState<CommerceSettings>({
    ...DEFAULT_COMMERCE_SETTINGS,
    ...(initialData.commerce ?? {}),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof CommerceSettings>(
    key: K,
    value: CommerceSettings[K],
  ) {
    setCommerce((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveSiteSettings({
        ...initialData,
        commerce,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Commerce settings saved — live on cart, checkout and COD.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Commerce & payments</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            GST default, free shipping threshold, COD / Razorpay toggles — applied
            live at checkout.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={isPending} className="gap-2">
          <Save className="size-4" />
          {isPending ? "Saving..." : "Save commerce"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gstPercent">Default jewellery GST %</Label>
            <Input
              id="gstPercent"
              type="number"
              step="0.1"
              value={commerce.gstPercent}
              onChange={(e) => setField("gstPercent", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freeShippingThreshold">Free shipping above (₹)</Label>
            <Input
              id="freeShippingThreshold"
              type="number"
              value={commerce.freeShippingThreshold}
              onChange={(e) =>
                setField("freeShippingThreshold", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shippingFee">Shipping fee below threshold (₹)</Label>
            <Input
              id="shippingFee"
              type="number"
              value={commerce.shippingFee}
              onChange={(e) => setField("shippingFee", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fastDeliveryFee">Fast delivery fee (₹)</Label>
            <Input
              id="fastDeliveryFee"
              type="number"
              value={commerce.fastDeliveryFee}
              onChange={(e) =>
                setField("fastDeliveryFee", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="returnWindowDays">Return window (days)</Label>
            <Input
              id="returnWindowDays"
              type="number"
              value={commerce.returnWindowDays}
              onChange={(e) =>
                setField("returnWindowDays", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxReturnsBeforeBlock">
              Max returns before account block
            </Label>
            <Input
              id="maxReturnsBeforeBlock"
              type="number"
              value={commerce.maxReturnsBeforeBlock}
              onChange={(e) =>
                setField("maxReturnsBeforeBlock", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCodOrderAmount">
              Max COD order (₹, 0 = no cap)
            </Label>
            <Input
              id="maxCodOrderAmount"
              type="number"
              value={commerce.maxCodOrderAmount}
              onChange={(e) =>
                setField("maxCodOrderAmount", Number(e.target.value))
              }
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["codEnabled", "Cash on delivery"],
              ["razorpayEnabled", "Razorpay online pay"],
              ["fastDeliveryEnabled", "Fast delivery option"],
              ["productApprovalRequired", "Product approval required"],
              ["reviewModeration", "Review moderation"],
              ["internationalShippingEnabled", "International shipping (enquire)"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3"
            >
              <span className="text-sm font-medium">{label}</span>
              <input
                type="checkbox"
                className="size-4 accent-[#8b2e2e]"
                checked={Boolean(commerce[key])}
                onChange={(e) => setField(key, e.target.checked)}
              />
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

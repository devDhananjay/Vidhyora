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
  IntegrationsSettings,
  SiteSettingsData,
} from "@/lib/validations/site-settings";
import { DEFAULT_INTEGRATIONS_SETTINGS } from "@/lib/validations/site-settings";

type IntegrationsSettingsFormProps = {
  initialData: SiteSettingsData;
};

const FEATURE_TOGGLES = [
  ["phoneOtpEnabled", "Phone OTP login (off until SMS API is live)"],
  ["guestWishlistEnabled", "Guest wishlist"],
  ["giftNotesEnabled", "Gift message / occasion note at checkout"],
  ["certificateEnabled", "Certificate number on products"],
  ["analyticsExportEnabled", "Analytics CSV export"],
  ["shiprocketEnabled", "Shiprocket live tracking"],
  ["otpDevBypass", "Allow test OTP 000000 (dev only)"],
] as const;

export function IntegrationsSettingsForm({
  initialData,
}: IntegrationsSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [integrations, setIntegrations] = useState<IntegrationsSettings>({
    ...DEFAULT_INTEGRATIONS_SETTINGS,
    ...(initialData.integrations ?? {}),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof IntegrationsSettings>(
    key: K,
    value: IntegrationsSettings[K],
  ) {
    setIntegrations((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveSiteSettings({
        ...initialData,
        integrations,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(
        "Integrations saved. SMS / Shiprocket / feature toggles are live now.",
      );
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Integrations & features</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            Configure Phone OTP SMS, Shiprocket, and nice-to-have feature flags.
            Env vars still work as fallback if fields are empty.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={isPending} className="gap-2">
          <Save className="size-4" />
          {isPending ? "Saving..." : "Save integrations"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
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

        <div>
          <h3 className="mb-3 text-sm font-semibold">Feature toggles</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURE_TOGGLES.map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3"
              >
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-[#8b2e2e]"
                  checked={Boolean(integrations[key])}
                  onChange={(e) => setField(key, e.target.checked)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">SMS provider (Phone OTP)</h3>
          <div className="space-y-2">
            <Label htmlFor="smsProvider">Provider</Label>
            <select
              id="smsProvider"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={integrations.smsProvider}
              onChange={(e) =>
                setField(
                  "smsProvider",
                  e.target.value as IntegrationsSettings["smsProvider"],
                )
              }
            >
              <option value="auto">Auto (MSG91 → Twilio → console)</option>
              <option value="msg91">MSG91 only</option>
              <option value="twilio">Twilio only</option>
              <option value="console">Console log only (testing)</option>
              <option value="off">Off</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="msg91AuthKey">MSG91 Auth Key</Label>
              <Input
                id="msg91AuthKey"
                type="password"
                autoComplete="off"
                value={integrations.msg91AuthKey}
                onChange={(e) => setField("msg91AuthKey", e.target.value)}
                placeholder="Leave blank to use MSG91_AUTH_KEY env"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg91SenderId">MSG91 Sender ID</Label>
              <Input
                id="msg91SenderId"
                value={integrations.msg91SenderId}
                onChange={(e) => setField("msg91SenderId", e.target.value)}
                placeholder="VIDYORA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg91TemplateId">MSG91 Template ID (optional)</Label>
              <Input
                id="msg91TemplateId"
                value={integrations.msg91TemplateId}
                onChange={(e) => setField("msg91TemplateId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilioAccountSid">Twilio Account SID</Label>
              <Input
                id="twilioAccountSid"
                value={integrations.twilioAccountSid}
                onChange={(e) => setField("twilioAccountSid", e.target.value)}
                placeholder="Leave blank to use env"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilioAuthToken">Twilio Auth Token</Label>
              <Input
                id="twilioAuthToken"
                type="password"
                autoComplete="off"
                value={integrations.twilioAuthToken}
                onChange={(e) => setField("twilioAuthToken", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="twilioFromNumber">Twilio From Number</Label>
              <Input
                id="twilioFromNumber"
                value={integrations.twilioFromNumber}
                onChange={(e) => setField("twilioFromNumber", e.target.value)}
                placeholder="+91XXXXXXXXXX"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Shiprocket</h3>
          <p className="text-xs text-muted-foreground">
            Enable the toggle above, then add API login credentials used for AWB
            tracking lookups.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shiprocketEmail">Shiprocket email</Label>
              <Input
                id="shiprocketEmail"
                type="email"
                value={integrations.shiprocketEmail}
                onChange={(e) => setField("shiprocketEmail", e.target.value)}
                placeholder="Leave blank to use SHIPROCKET_EMAIL env"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiprocketPassword">Shiprocket password</Label>
              <Input
                id="shiprocketPassword"
                type="password"
                autoComplete="off"
                value={integrations.shiprocketPassword}
                onChange={(e) => setField("shiprocketPassword", e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

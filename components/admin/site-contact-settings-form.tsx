"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import {
  resetSiteSettings,
  saveSiteSettings,
} from "@/actions/admin/manage-site-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SiteSettingsData } from "@/lib/validations/site-settings";
import { appConfirm } from "@/components/shared/app-dialog";

type SiteContactSettingsFormProps = {
  initialData: SiteSettingsData;
  updatedAt: string | null;
  source: "database" | "default";
};

export function SiteContactSettingsForm({
  initialData,
  updatedAt,
  source,
}: SiteContactSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<SiteSettingsData>(initialData);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveSiteSettings(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Website contact settings saved.");
      router.refresh();
    });
  }

  async function reset() {
    if (
      !(await appConfirm(
        "Reset email, phone and social links to the built-in defaults?",
      ))
    ) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resetSiteSettings();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setData(result.data.data);
      setMessage("Reset to default contact settings.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Website contact & social</CardTitle>
          <p className="mt-1 text-sm font-normal text-muted-foreground">
            Shown in the header, footer, contact and help pages. Source:{" "}
            <span className="font-medium text-foreground">
              {source === "database" ? "Database" : "Built-in default"}
            </span>
            {updatedAt ? (
              <>
                {" "}
                · Last saved {new Date(updatedAt).toLocaleString("en-IN")}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={reset}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={save}
            className="gap-2"
          >
            <Save className="size-4" />
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {message ? (
          <p className="text-sm text-green-700">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={data.contact.supportEmail}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, supportEmail: e.target.value },
                }))
              }
              placeholder="support@vidyora.co.in"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supportPhone">Phone (display)</Label>
            <Input
              id="supportPhone"
              value={data.contact.supportPhone}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  contact: { ...prev.contact, supportPhone: e.target.value },
                }))
              }
              placeholder="+91 94114 41937"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp number</Label>
            <Input
              id="whatsappNumber"
              value={data.contact.whatsappNumber}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    whatsappNumber: e.target.value.replace(/\D/g, ""),
                  },
                }))
              }
              placeholder="919411441937"
            />
            <p className="text-xs text-muted-foreground">
              Digits only with country code (no + or spaces). Used for wa.me
              links.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Social media links</p>
          <p className="text-xs text-muted-foreground">
            Leave blank to hide that icon on the storefront footer.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["instagram", "Instagram"],
                ["facebook", "Facebook"],
                ["twitter", "X (Twitter)"],
                ["youtube", "YouTube"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={data.social[key]}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      social: { ...prev.social, [key]: e.target.value },
                    }))
                  }
                  placeholder={
                    key === "instagram"
                      ? "https://www.instagram.com/vidyora_official/"
                      : "https://"
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

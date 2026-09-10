"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  saveNotificationPreferences,
  type NotificationPreferenceValues,
} from "@/actions/account/notification-preferences";
import { Loader2 } from "lucide-react";

const FIELDS: {
  key: keyof NotificationPreferenceValues;
  label: string;
  description: string;
}[] = [
  {
    key: "orderUpdates",
    label: "Order updates",
    description: "Confirmation, shipping, cancellation and return emails",
  },
  {
    key: "promotions",
    label: "Promotions & offers",
    description: "Festival sales, coupons and marketing campaigns",
  },
  {
    key: "priceDrops",
    label: "Price drop alerts",
    description: "When jewellery on your watchlist gets cheaper",
  },
  {
    key: "productBackInStock",
    label: "Back in stock",
    description: "When sold-out pieces you follow return",
  },
];

type NotificationPreferencesFormProps = {
  initial: NotificationPreferenceValues;
};

export function NotificationPreferencesForm({
  initial,
}: NotificationPreferencesFormProps) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(key: keyof NotificationPreferenceValues) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await saveNotificationPreferences(values);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setValues(result.data);
      setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {saved ? (
        <Alert>
          <AlertDescription>Notification preferences saved.</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        {FIELDS.map((field) => (
          <label
            key={field.key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-3 py-3"
          >
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={values[field.key]}
              onChange={() => toggle(field.key)}
              disabled={pending}
            />
            <span className="text-sm leading-5">
              <span className="font-medium text-neutral-900">{field.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {field.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Save preferences
      </Button>
    </form>
  );
}

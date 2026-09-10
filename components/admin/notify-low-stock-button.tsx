"use client";

import { useState, useTransition } from "react";
import { notifySellersLowStock } from "@/actions/admin/get-low-stock";
import { Button } from "@/components/ui/button";

export function NotifyLowStockButton({ threshold }: { threshold: number }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await notifySellersLowStock(threshold);
            if (!result.success) {
              setMessage(result.error);
              return;
            }
            setMessage(`Notified sellers for ${result.data.notified} product(s).`);
          });
        }}
      >
        {isPending ? "Sending…" : "Email sellers"}
      </Button>
      {message ? (
        <span className="text-sm text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}

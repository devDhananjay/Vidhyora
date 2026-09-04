"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSellerOrderFulfillment } from "@/actions/seller/manage-orders";
import {
  getNextFulfillmentStep,
  getOrderStatusLabel,
} from "@/lib/orders/order-utils";

type SellerFulfillmentActionsProps = {
  orderItemId: string;
  currentStatus: string;
  compact?: boolean;
};

export function SellerFulfillmentActions({
  orderItemId,
  currentStatus,
  compact = false,
}: SellerFulfillmentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState("");
  const [error, setError] = useState<string | null>(null);

  const step = getNextFulfillmentStep(currentStatus);

  if (!step) {
    if (compact) return null;
    return (
      <p className="text-sm text-muted-foreground">
        No further seller actions. Status: {getOrderStatusLabel(currentStatus)}
      </p>
    );
  }

  const handleUpdate = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateSellerOrderFulfillment({
        orderItemId,
        status: step.nextStatus,
        trackingNumber: trackingNumber || undefined,
        courier: courier || undefined,
      });
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <Button size="sm" onClick={handleUpdate} disabled={isPending}>
          {isPending ? "Updating..." : step.label}
        </Button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">{step.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
      </div>

      {step.nextStatus === "SHIPPED" ? (
        <div className="space-y-3">
          <Input
            placeholder="Tracking number (optional)"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
          />
          <Input
            placeholder="Courier (optional)"
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button className="w-full" onClick={handleUpdate} disabled={isPending}>
        {isPending ? "Updating..." : step.label}
      </Button>
    </div>
  );
}

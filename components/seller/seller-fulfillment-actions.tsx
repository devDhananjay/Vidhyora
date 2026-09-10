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
  preferredCourier?: string | null;
};

export function SellerFulfillmentActions({
  orderItemId,
  currentStatus,
  compact = false,
  preferredCourier = "",
}: SellerFulfillmentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courier, setCourier] = useState(preferredCourier || "");
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
    if (step.nextStatus === "SHIPPED") {
      if (!trackingNumber.trim() || !courier.trim()) {
        setError("Tracking number and courier are required to mark as shipped");
        return;
      }
    }
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
    if (step.nextStatus === "SHIPPED") {
      return (
        <div className="space-y-2">
          <Input
            placeholder="Tracking number *"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            className="h-8 text-xs"
          />
          <Input
            placeholder="Courier *"
            value={courier}
            onChange={(event) => setCourier(event.target.value)}
            className="h-8 text-xs"
          />
          <Button size="sm" onClick={handleUpdate} disabled={isPending}>
            {isPending ? "Updating..." : step.label}
          </Button>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      );
    }
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
            placeholder="Tracking number *"
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
          />
          <Input
            placeholder="Courier *"
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

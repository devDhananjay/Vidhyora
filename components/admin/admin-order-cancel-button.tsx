"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminCancelOrder } from "@/actions/admin/manage-orders";
import { canCancelOrder } from "@/lib/orders/order-utils";
import { appAlert, appConfirm } from "@/components/shared/app-dialog";

export function AdminOrderCancelButton({
  orderId,
  orderStatus,
}: {
  orderId: string;
  orderStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (!canCancelOrder(orderStatus)) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      className="rounded-full border-red-200 text-red-700 hover:bg-red-50"
      onClick={async () => {
        if (!(await appConfirm("Cancel this order for the customer?"))) return;
        startTransition(async () => {
          const result = await adminCancelOrder(orderId);
          if (!result.success) {
            await appAlert(result.error, { variant: "error" });
            return;
          }
          window.location.reload();
        });
      }}
    >
      {isPending ? "Cancelling…" : "Cancel order"}
    </Button>
  );
}

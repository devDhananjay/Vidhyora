"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { canCancelOrder } from "@/lib/orders/order-utils";
import { cancelOrder } from "@/actions/orders/cancel-order";
import type { OrderWithDetails } from "@/types/order";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type OrderActionsProps = {
  order: OrderWithDetails;
};

export function OrderActions({ order }: OrderActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (reason.length < 10) {
      alert("Please provide a reason (minimum 10 characters)");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", order.id);
      formData.append("reason", reason);

      const result = await cancelOrder(formData);

      if (result.success) {
        setIsOpen(false);
        alert("Order cancelled successfully");
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  if (!canCancelOrder(order.orderStatus)) {
    return null;
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-4 font-semibold">Order Actions</h3>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" size="lg">
            <X className="mr-2 size-5" />
            Cancel Order
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this order. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you want to cancel this order..."
                rows={4}
                className="mt-2"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Minimum 10 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                disabled={isPending}
              >
                Keep Order
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

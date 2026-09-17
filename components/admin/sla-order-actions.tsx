"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  escalateSlaOrder,
  nudgeSellerOnSlaOrder,
} from "@/actions/admin/manage-sla";
import { Bell, Flag } from "lucide-react";
import { appAlert } from "@/components/shared/app-dialog";

type SlaOrderActionsProps = {
  orderId: string;
  nudgedAt?: string | Date | null;
  escalatedAt?: string | Date | null;
};

export function SlaOrderActions({
  orderId,
  nudgedAt,
  escalatedAt,
}: SlaOrderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const handleNudge = () => {
    startTransition(async () => {
      const result = await nudgeSellerOnSlaOrder(orderId);
      if (result.success) {
        await appAlert("Seller nudged via email.", { variant: "success" });
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const handleEscalate = () => {
    startTransition(async () => {
      const result = await escalateSlaOrder(orderId, note);
      if (result.success) {
        await appAlert("Order escalated.", { variant: "success" });
        setOpen(false);
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleNudge}
        disabled={isPending}
        className="gap-1.5"
      >
        <Bell className="size-3.5" />
        {nudgedAt ? "Nudge again" : "Nudge seller"}
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="gap-1.5 bg-amber-600 hover:bg-amber-700"
      >
        <Flag className="size-3.5" />
        {escalatedAt ? "Add escalate note" : "Escalate"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate delayed order</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)…"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEscalate}
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveProduct,
  rejectProduct,
  suspendProduct,
  activateProduct,
} from "@/actions/admin/manage-products";
import { CheckCircle, XCircle, Ban } from "lucide-react";

type ProductActionsProps = {
  productId: string;
  currentStatus: string;
};

export function ProductActions({
  productId,
  currentStatus,
}: ProductActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveProduct(productId);
      if (result.success) {
        alert("Product approved successfully!");
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleReject = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    startTransition(async () => {
      const result = await rejectProduct(productId, reason);
      if (result.success) {
        alert("Product rejected successfully!");
        setRejectDialogOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleSuspend = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for suspension");
      return;
    }

    startTransition(async () => {
      const result = await suspendProduct(productId, reason);
      if (result.success) {
        alert("Product deactivated.");
        setSuspendDialogOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      const result = await activateProduct(productId);
      if (result.success) {
        alert("Product activated.");
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {currentStatus === "PENDING_APPROVAL" && (
        <Button
          onClick={handleApprove}
          disabled={isPending}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <CheckCircle className="size-4" />
          Approve
        </Button>
      )}

      {(currentStatus === "PENDING_APPROVAL" || currentStatus === "APPROVED") && (
        <Button
          type="button"
          onClick={() => {
            setReason("");
            setRejectDialogOpen(true);
          }}
          disabled={isPending}
          className="gap-2 bg-red-600 text-white hover:bg-red-700"
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      )}

      {currentStatus === "APPROVED" && (
        <Button
          type="button"
          onClick={() => {
            setReason("");
            setSuspendDialogOpen(true);
          }}
          disabled={isPending}
          className="gap-2 bg-amber-600 text-white hover:bg-amber-700"
        >
          <Ban className="size-4" />
          Deactivate
        </Button>
      )}

      {(currentStatus === "SUSPENDED" || currentStatus === "REJECTED") && (
        <Button
          type="button"
          onClick={handleActivate}
          disabled={isPending}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <CheckCircle className="size-4" />
          Activate
        </Button>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Rejection Reason *
              </label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection"
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isPending || !reason.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="suspend-reason" className="text-sm font-medium">
                Suspension Reason *
              </label>
              <Textarea
                id="suspend-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for deactivation"
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={isPending || !reason.trim()}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

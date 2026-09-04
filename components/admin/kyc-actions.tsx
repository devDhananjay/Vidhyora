"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  rejectSellerKyc,
  verifySellerKyc,
} from "@/actions/admin/manage-kyc";

export function KycActions({
  sellerId,
  kycStatus,
  hasDocuments,
}: {
  sellerId: string;
  kycStatus: string;
  hasDocuments: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const verify = () => {
    startTransition(async () => {
      const result = await verifySellerKyc(sellerId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const reject = () => {
    if (!reason.trim()) {
      alert("Please provide a reason");
      return;
    }
    startTransition(async () => {
      const result = await rejectSellerKyc(sellerId, reason);
      if (result.success) {
        setOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  if (kycStatus === "VERIFIED") {
    return (
      <p className="text-sm text-muted-foreground">KYC is verified.</p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={verify}
          disabled={isPending || !hasDocuments}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Verify KYC
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setReason("");
            setOpen(true);
          }}
          disabled={isPending}
        >
          Reject KYC
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tell the seller admin why these documents were rejected"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={reject}
              disabled={isPending || !reason.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  approveReturnRequest,
  rejectReturnRequest,
  completeReturnRequest,
  markReturnPickedUp,
} from "@/actions/admin/manage-returns";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle, Package, XCircle } from "lucide-react";
import { appAlert } from "@/components/shared/app-dialog";

export type ReturnRequestCardData = {
  id: string;
  type: string;
  status: string;
  reason: string;
  description: string | null;
  adminNote: string | null;
  requestedAt: Date;
  user: { name: string | null; email: string };
  orderItem: {
    total: { toString(): string } | number;
    product: {
      name: string;
      thumbnail: string | null;
      seller?: { businessName: string } | null;
    };
    order: { orderNumber: string };
  };
};

function statusBadge(status: string) {
  if (status === "PENDING") {
    return (
      <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
        Pending
      </Badge>
    );
  }
  if (status === "APPROVED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
        Approved
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge className="border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
        Rejected
      </Badge>
    );
  }
  if (status === "COMPLETED") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
        Completed
      </Badge>
    );
  }
  if (status === "PICKED_UP") {
    return (
      <Badge className="border-[#ead9c4] bg-[#f6ead7] text-[#8b2e2e] hover:bg-[#f6ead7]">
        Picked up
      </Badge>
    );
  }
  return <Badge variant="outline">{status}</Badge>;
}

export function ReturnModerationCard({
  item,
  showSeller,
}: {
  item: ReturnRequestCardData;
  showSeller?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  const approve = () => {
    startTransition(async () => {
      const result = await approveReturnRequest(item.id);
      if (result.success) {
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const reject = async () => {
    if (!note.trim()) {
      await appAlert("Please provide a reason");
      return;
    }
    startTransition(async () => {
      const result = await rejectReturnRequest(item.id, note);
      if (result.success) {
        setRejectOpen(false);
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const complete = () => {
    startTransition(async () => {
      const result = await completeReturnRequest(item.id);
      if (result.success) {
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const pickUp = () => {
    startTransition(async () => {
      const result = await markReturnPickedUp(item.id);
      if (result.success) {
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <Card className="overflow-hidden border-[#ead9c4]/80 transition hover:border-[#d4b896]">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#f6ead7] sm:size-24">
            {item.orderItem.product.thumbnail ? (
              <Image
                src={item.orderItem.product.thumbnail}
                alt={item.orderItem.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-[#8b2e2e]/60">
                —
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-serif text-lg text-neutral-900 sm:text-xl">
                  {item.orderItem.product.name}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-neutral-700">
                    {item.orderItem.order.orderNumber}
                  </span>
                  {" · "}
                  {item.user.name || item.user.email}
                </p>
                {showSeller && item.orderItem.product.seller ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Seller: {item.orderItem.product.seller.businessName}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[#ead9c4] bg-[#faf6f0] text-[#8b2e2e]"
                >
                  {item.type === "REPLACEMENT" ? "Replacement" : "Return"}
                </Badge>
                {statusBadge(item.status)}
                <span className="font-serif text-xl text-neutral-900">
                  {formatCurrency(Number(item.orderItem.total))}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#faf7f5] px-3.5 py-3 text-sm">
              <p>
                <span className="text-muted-foreground">Reason · </span>
                <span className="font-medium text-neutral-800">{item.reason}</span>
              </p>
              {item.description ? (
                <p className="mt-1 text-muted-foreground">{item.description}</p>
              ) : null}
              {item.adminNote ? (
                <p className="mt-1 text-[#8b2e2e]">Note · {item.adminNote}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                Requested {format(new Date(item.requestedAt), "dd MMM yyyy")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.status === "PENDING" ? (
                <>
                  <Button
                    type="button"
                    onClick={approve}
                    disabled={isPending}
                    className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    <CheckCircle className="size-4" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setNote("");
                      setRejectOpen(true);
                    }}
                    disabled={isPending}
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </>
              ) : null}
              {item.status === "APPROVED" ? (
                <>
                  <Button
                    type="button"
                    onClick={pickUp}
                    disabled={isPending}
                    variant="outline"
                    className="gap-2 border-[#ead9c4]"
                  >
                    <Package className="size-4" />
                    Mark picked up
                  </Button>
                  <Button
                    type="button"
                    onClick={complete}
                    disabled={isPending}
                    className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    <CheckCircle className="size-4" />
                    {item.type === "RETURN"
                      ? "Complete & refund"
                      : "Mark completed"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setNote("");
                      setRejectOpen(true);
                    }}
                    disabled={isPending}
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </>
              ) : null}
              {item.status === "PICKED_UP" ? (
                <Button
                  type="button"
                  onClick={complete}
                  disabled={isPending}
                  className="gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  <CheckCircle className="size-4" />
                  {item.type === "RETURN"
                    ? "Complete & refund"
                    : "Mark completed"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tell the customer why this return or replacement is rejected"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={reject}
              disabled={isPending || !note.trim()}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

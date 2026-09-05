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
} from "@/actions/admin/manage-returns";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

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
  if (status === "PENDING") return <Badge className="bg-yellow-600">Pending</Badge>;
  if (status === "APPROVED") return <Badge className="bg-green-600">Approved</Badge>;
  if (status === "REJECTED") return <Badge className="bg-red-600 text-white">Rejected</Badge>;
  if (status === "COMPLETED") return <Badge className="bg-emerald-600">Completed</Badge>;
  if (status === "PICKED_UP") return <Badge className="bg-blue-600">Picked up</Badge>;
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
        alert(result.error);
      }
    });
  };

  const reject = () => {
    if (!note.trim()) {
      alert("Please provide a reason");
      return;
    }
    startTransition(async () => {
      const result = await rejectReturnRequest(item.id, note);
      if (result.success) {
        setRejectOpen(false);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const complete = () => {
    startTransition(async () => {
      const result = await completeReturnRequest(item.id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.orderItem.product.thumbnail ? (
              <Image
                src={item.orderItem.product.thumbnail}
                alt={item.orderItem.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                —
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{item.orderItem.product.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.orderItem.order.orderNumber} • {item.user.name} •{" "}
                  {formatCurrency(Number(item.orderItem.total))}
                </p>
                {showSeller && item.orderItem.product.seller ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Seller admin: {item.orderItem.product.seller.businessName}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">
                  {item.type === "REPLACEMENT" ? "Replacement" : "Return"}
                </Badge>
                {statusBadge(item.status)}
              </div>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">Reason: </span>
              {item.reason}
            </p>
            {item.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            ) : null}
            {item.adminNote ? (
              <p className="mt-1 text-sm text-red-700">Note: {item.adminNote}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Requested {format(new Date(item.requestedAt), "dd MMM yyyy")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status === "PENDING" ? (
                <>
                  <Button
                    type="button"
                    onClick={approve}
                    disabled={isPending}
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
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
                    className="gap-2 bg-red-600 text-white hover:bg-red-700"
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
                    onClick={complete}
                    disabled={isPending}
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
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
                    className="gap-2 bg-red-600 text-white hover:bg-red-700"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </>
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

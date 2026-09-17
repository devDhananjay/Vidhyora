"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { settleSellerPayout } from "@/actions/admin/manage-payouts";
import { appAlert, appConfirm } from "@/components/shared/app-dialog";

export function SettlePayoutButton({
  sellerId,
  amountLabel,
}: {
  sellerId: string;
  amountLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  const settle = async () => {
    if (
      !(await appConfirm(
        `Mark ${amountLabel} as paid to this seller admin? This records a settlement in the ledger.`,
      ))
    ) {
      return;
    }

    const utr = window.prompt(
      "Enter bank UTR / NEFT / IMPS reference (optional but recommended):",
      "",
    );
    if (utr === null) {
      return;
    }

    startTransition(async () => {
      const result = await settleSellerPayout(sellerId, {
        utr: utr.trim() || undefined,
      });
      if (result.success) {
        window.location.reload();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <Button
      type="button"
      onClick={settle}
      disabled={isPending}
      className="bg-emerald-600 text-white hover:bg-emerald-700"
    >
      {isPending ? "Settling..." : "Settle payout"}
    </Button>
  );
}

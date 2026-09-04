"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { settleSellerPayout } from "@/actions/admin/manage-payouts";

export function SettlePayoutButton({
  sellerId,
  amountLabel,
}: {
  sellerId: string;
  amountLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  const settle = () => {
    if (
      !confirm(
        `Mark ${amountLabel} as paid to this seller admin? This records a settlement in the ledger.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await settleSellerPayout(sellerId);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
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

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cloneProduct } from "@/actions/seller/manage-products";
import { Copy } from "lucide-react";
import { appAlert, appConfirm } from "@/components/shared/app-dialog";

type CloneProductButtonProps = {
  productId: string;
  productName: string;
};

export function CloneProductButton({
  productId,
  productName,
}: CloneProductButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClone = async () => {
    const ok = await appConfirm(
      `Clone "${productName}"? A draft copy will be created with stock set to 0 so you can change size, metal, or SKU.`,
      { title: "Clone listing", confirmLabel: "Clone" },
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await cloneProduct(productId);
      if (result.success) {
        await appAlert("Listing cloned as draft.", { variant: "success" });
        router.push(`/seller/products/${result.data.id}/edit`);
        router.refresh();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClone}
      disabled={isPending}
      className="gap-1.5"
    >
      <Copy className="size-3.5" />
      {isPending ? "Cloning…" : "Clone"}
    </Button>
  );
}

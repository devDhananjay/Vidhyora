"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSellerProduct } from "@/actions/seller/manage-products";
import { appAlert } from "@/components/shared/app-dialog";

type SellerProductDeleteButtonProps = {
  productId: string;
  productName: string;
  /** After delete, go to products list (detail page) vs refresh list */
  redirectToList?: boolean;
  size?: "sm" | "default";
  className?: string;
};

export function SellerProductDeleteButton({
  productId,
  productName,
  redirectToList = false,
  size = "sm",
  className,
}: SellerProductDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSellerProduct(productId);
      if (!result.success) {
        await appAlert(result.error || "Failed to delete product", {
          variant: "error",
        });
        setOpen(false);
        return;
      }
      setOpen(false);
      if (redirectToList) {
        router.push("/seller/products");
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={size}
        className={
          className ||
          "border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
        }
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-1.5 size-3.5" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              Remove <span className="font-medium text-foreground">{productName}</span>{" "}
              from your store. If this product has past orders, it will be
              archived so order history stays intact. Otherwise it will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting…" : "Delete product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

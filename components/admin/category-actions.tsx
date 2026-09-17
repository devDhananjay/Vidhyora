"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  deleteCategory,
  toggleCategoryStatus,
} from "@/actions/admin/manage-categories";
import { appAlert } from "@/components/shared/app-dialog";

type CategoryActionsProps = {
  categoryId: string;
  isActive: boolean;
  /** When true, show a clear Show/Hide switch (useful for subcategories). */
  showInlineToggle?: boolean;
};

export function CategoryActions({
  categoryId,
  isActive,
  showInlineToggle = true,
}: CategoryActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleCategoryStatus(categoryId);
      if (result.success) {
        router.refresh();
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        setDeleteDialogOpen(false);
        router.refresh();
      } else {
        await appAlert(result.error, { variant: "error" });
        setDeleteDialogOpen(false);
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {showInlineToggle ? (
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
            <Label
              htmlFor={`cat-visible-${categoryId}`}
              className="cursor-pointer text-xs font-medium text-muted-foreground"
            >
              {isActive ? "Shown" : "Hidden"}
            </Label>
            <Switch
              id={`cat-visible-${categoryId}`}
              checked={isActive}
              disabled={isPending}
              onCheckedChange={() => handleToggleStatus()}
            />
          </div>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/categories/${categoryId}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone. The category must have no products or subcategories.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

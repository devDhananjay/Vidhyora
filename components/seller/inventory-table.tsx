"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkUpdateStock, updateVariantStock } from "@/actions/seller/manage-inventory";
import { Edit, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { appAlert } from "@/components/shared/app-dialog";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type InventoryTableProps = {
  inventory: any[];
};

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkStock, setBulkStock] = useState<string>("");

  const allVariants = useMemo(
    () =>
      inventory.flatMap((product) =>
        product.variants.map((variant: any) => ({
          ...variant,
          productName: product.name,
        })),
      ),
    [inventory],
  );

  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  const toggleAll = (on: boolean) => {
    const next: Record<string, boolean> = {};
    if (on) {
      for (const v of allVariants) next[v.id] = true;
    }
    setSelected(next);
  };

  const handleUpdateStock = (variantId: string, currentStock: number) => {
    setEditingVariant(variantId);
    setStockValue(currentStock);
  };

  const handleSaveStock = (variantId: string) => {
    startTransition(async () => {
      const result = await updateVariantStock(variantId, stockValue);
      if (result.success) {
        setEditingVariant(null);
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  const handleBulkApply = () => {
    const stock = parseInt(bulkStock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      void appAlert("Enter a valid stock number (0 or more)", { variant: "error" });
      return;
    }
    if (selectedIds.length === 0) {
      void appAlert("Select at least one variant");
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateStock(
        selectedIds.map((variantId) => ({ variantId, stock })),
      );
      if (result.success) {
        setSelected({});
        setBulkStock("");
        await appAlert(`Updated stock for ${selectedIds.length} variant(s).`, {
          variant: "success",
        });
      } else {
        await appAlert(result.error, { variant: "error" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[#e8d5d0] bg-[#faf7f5] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Checkbox
            checked={
              allVariants.length > 0 && selectedIds.length === allVariants.length
            }
            onCheckedChange={(v) => toggleAll(Boolean(v))}
            id="select-all-variants"
          />
          <label htmlFor="select-all-variants" className="text-sm font-medium">
            Select all variants ({selectedIds.length} selected)
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Set stock to…"
            value={bulkStock}
            onChange={(e) => setBulkStock(e.target.value)}
            className="w-32 bg-white"
            disabled={isPending || selectedIds.length === 0}
          />
          <Button
            type="button"
            onClick={handleBulkApply}
            disabled={isPending || selectedIds.length === 0}
            className="bg-[#8b2e2e] hover:bg-[#6f2424]"
          >
            <Package className="mr-1.5 size-4" />
            {isPending ? "Updating…" : "Bulk update"}
          </Button>
        </div>
      </div>

      {inventory.map((product) => (
        <div key={product.id} className="rounded-xl border">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:gap-4">
            {product.thumbnail ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded">
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded bg-muted text-2xl">
                📦
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.category.name} • {product.brand}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {product.isLowStock && (
                    <Badge
                      variant="outline"
                      className="border-yellow-600 text-yellow-600"
                    >
                      <AlertTriangle className="mr-1 size-3" />
                      Low Stock
                    </Badge>
                  )}
                  {product.availableStock === 0 && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                  <Link href={`/seller/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="size-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Stock:</span>{" "}
                  <span className="font-medium">{product.totalStock}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reserved:</span>{" "}
                  <span className="font-medium">{product.totalReserved}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Available:</span>{" "}
                  <span
                    className={cn(
                      "font-medium",
                      product.availableStock === 0 && "text-destructive",
                      product.isLowStock && "text-yellow-600",
                    )}
                  >
                    {product.availableStock}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {product.variants.map((variant: any) => {
              const isEditing = editingVariant === variant.id;
              const available = variant.stock - variant.reservedStock;

              return (
                <div
                  key={variant.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Checkbox
                      checked={Boolean(selected[variant.id])}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({
                          ...prev,
                          [variant.id]: Boolean(v),
                        }))
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="font-medium">
                        {variant.attributes?.name || variant.sku}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {variant.sku}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={stockValue}
                          onChange={(e) =>
                            setStockValue(parseInt(e.target.value) || 0)
                          }
                          className="w-24"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveStock(variant.id)}
                          disabled={isPending}
                        >
                          {isPending ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVariant(null);
                            setStockValue(0);
                          }}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="text-right">
                          <div className="font-medium">{variant.stock} units</div>
                          <div className="text-sm text-muted-foreground">
                            {variant.reservedStock} reserved • {available}{" "}
                            available
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateStock(variant.id, variant.stock)
                          }
                          disabled={isPending}
                        >
                          Update
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

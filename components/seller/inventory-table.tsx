"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateVariantStock } from "@/actions/seller/manage-inventory";
import { Edit, AlertTriangle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type InventoryTableProps = {
  inventory: any[];
};

export function InventoryTable({ inventory }: InventoryTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState<number>(0);

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
        alert(result.error);
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingVariant(null);
    setStockValue(0);
  };

  return (
    <div className="space-y-4">
      {inventory.map((product) => (
        <div key={product.id} className="rounded-lg border">
          {/* Product Header */}
          <div className="flex items-center gap-4 border-b p-4">
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

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.category.name} • {product.brand}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {product.isLowStock && (
                    <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                      <AlertTriangle className="mr-1 size-3" />
                      Low Stock
                    </Badge>
                  )}
                  {product.availableStock === 0 && (
                    <Badge variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                  <Link href={`/seller/products/${product.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="size-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-2 flex gap-4 text-sm">
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

          {/* Variants Table */}
          <div className="divide-y">
            {product.variants.map((variant: any) => {
              const isEditing = editingVariant === variant.id;
              const available = variant.stock - variant.reservedStock;

              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {variant.attributes?.name || variant.sku}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {variant.sku}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={stockValue}
                            onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
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
                            onClick={handleCancelEdit}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-right">
                          <div className="font-medium">{variant.stock} units</div>
                          <div className="text-sm text-muted-foreground">
                            {variant.reservedStock} reserved • {available} available
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStock(variant.id, variant.stock)}
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

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, Heart } from "lucide-react";
import type { CartItemWithDetails } from "@/types/cart";
import { updateCartItemQuantity } from "@/actions/cart/update-cart-item";
import { removeCartItem } from "@/actions/cart/remove-cart-item";
import { toggleSaveForLater } from "@/actions/cart/save-for-later";

type CartItemCardProps = {
  item: CartItemWithDetails;
};

export function CartItemCard({ item }: CartItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(item.quantity);

  const price = Number(item.variant.price);
  const total = price * quantity;
  const availableStock = item.variant.stock - item.variant.reservedStock;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > availableStock) return;

    setQuantity(newQuantity);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("cartItemId", item.id);
      formData.append("quantity", newQuantity.toString());

      const result = await updateCartItemQuantity(formData);
      if (!result.success) {
        alert(result.error);
        setQuantity(item.quantity);
      }
    });
  };

  const handleRemove = () => {
    if (!confirm("Remove this item from cart?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("cartItemId", item.id);

      const result = await removeCartItem(formData);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const handleSaveForLater = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("cartItemId", item.id);
      formData.append("savedForLater", "true");

      const result = await toggleSaveForLater(formData);
      if (!result.success) {
        alert(result.error);
      }
    });
  };

  const attributes = item.variant.attributes as Record<string, string> | null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row">
      {/* Product Image */}
      <Link
        href={`/products/${item.product.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded"
      >
        {item.product.thumbnail ? (
          <Image
            src={item.product.thumbnail}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted text-4xl">
            📦
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <Link
            href={`/products/${item.product.slug}`}
            className="font-medium hover:text-primary"
          >
            {item.product.name}
          </Link>
          {attributes && (
            <div className="mt-1 text-sm text-muted-foreground">
              {Object.entries(attributes).map(([key, value]) => (
                <span key={key}>
                  {key}: {value} |{" "}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatCurrency(price)}
          </span>
          {item.variant.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(Number(item.variant.compareAtPrice))}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {availableStock < 10 && availableStock > 0 && (
          <div className="text-sm text-orange-600">
            Only {availableStock} left in stock
          </div>
        )}
        {availableStock === 0 && (
          <div className="text-sm text-destructive">Out of stock</div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isPending || quantity <= 1}
            >
              <Minus className="size-4" />
            </Button>
            <span className="w-8 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isPending || quantity >= availableStock}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="hidden text-sm text-muted-foreground sm:block">|</div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="mr-2 size-4" />
            Remove
          </Button>

          {/* Save for Later */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveForLater}
            disabled={isPending}
          >
            <Heart className="mr-2 size-4" />
            Save for Later
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t pt-3 sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right">
        <span className="text-sm text-muted-foreground sm:hidden">Total</span>
        <div className="text-lg font-semibold">{formatCurrency(total)}</div>
      </div>
    </div>
  );
}

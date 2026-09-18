"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { addToCart } from "@/actions/cart/add-to-cart";
import { buyNow } from "@/actions/cart/buy-now";
import { updateCartItemQuantity } from "@/actions/cart/update-cart-item";
import { removeCartItem } from "@/actions/cart/remove-cart-item";
import type { CartPlpLine } from "@/actions/cart/get-cart";
import { appAlert } from "@/components/shared/app-dialog";
import { showActionToast } from "@/components/shared/action-toast";
import { cn } from "@/lib/utils";

export type CardVariantOption = {
  id: string;
  stock: number;
  label: string;
};

type ProductCardQuickAddProps = {
  productId: string;
  variants: CardVariantOption[];
  /** Cart lines for this product only */
  cartLines?: CartPlpLine[];
  className?: string;
};

type PickerMode = "cart" | "buy" | null;

export function ProductCardQuickAdd({
  productId,
  variants,
  cartLines = [],
  className,
}: ProductCardQuickAddProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const inStock = variants.filter((v) => v.stock > 0);
  const single = inStock.length === 1 ? inStock[0] : null;
  const needsPick = inStock.length > 1;
  const totalQty = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const primaryLine = cartLines[0] ?? null;
  const inCart = totalQty > 0;

  useEffect(() => {
    if (!pickerMode) return;
    function onDoc(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setPickerMode(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerMode]);

  function refresh() {
    router.refresh();
  }

  function addVariant(variantId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("variantId", variantId);
      formData.append("quantity", "1");
      const result = await addToCart(formData);
      if (!result.success) {
        await appAlert(result.error || "Failed to add to cart", {
          variant: "error",
        });
        return;
      }
      setPickerMode(null);
      showActionToast({
        message: "Added to cart",
        href: "/cart",
        linkLabel: "View cart →",
      });
      refresh();
    });
  }

  function buyVariant(variantId: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("variantId", variantId);
      formData.append("quantity", "1");
      const result = await buyNow(formData);
      if (!result.success) {
        await appAlert(result.error || "Failed to start checkout", {
          variant: "error",
        });
        return;
      }
      setPickerMode(null);
      router.push(result.data.checkoutUrl);
    });
  }

  function setLineQty(line: CartPlpLine, nextQty: number) {
    startTransition(async () => {
      if (nextQty <= 0) {
        const formData = new FormData();
        formData.append("cartItemId", line.cartItemId);
        const result = await removeCartItem(formData);
        if (!result.success) {
          await appAlert(result.error || "Failed to remove item", {
            variant: "error",
          });
          return;
        }
        refresh();
        return;
      }

      if (nextQty > line.availableStock) {
        await appAlert(`Only ${line.availableStock} available in stock`, {
          variant: "error",
        });
        return;
      }

      const formData = new FormData();
      formData.append("cartItemId", line.cartItemId);
      formData.append("quantity", String(nextQty));
      const result = await updateCartItemQuantity(formData);
      if (!result.success) {
        await appAlert(result.error || "Failed to update quantity", {
          variant: "error",
        });
        return;
      }
      refresh();
    });
  }

  function onClickAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isPending || inStock.length === 0) return;
    if (single) {
      addVariant(single.id);
      return;
    }
    setPickerMode("cart");
  }

  function onClickBuy(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isPending || inStock.length === 0) return;
    if (single) {
      buyVariant(single.id);
      return;
    }
    setPickerMode("buy");
  }

  function onMinus(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!primaryLine || isPending) return;
    setLineQty(primaryLine, primaryLine.quantity - 1);
  }

  function onPlus(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;

    if (needsPick && cartLines.length !== 1) {
      setPickerMode("cart");
      return;
    }

    if (primaryLine) {
      setLineQty(primaryLine, primaryLine.quantity + 1);
      return;
    }

    if (single) {
      addVariant(single.id);
      return;
    }
    setPickerMode("cart");
  }

  if (variants.length === 0) {
    return null;
  }

  return (
    <div ref={wrapRef} className={cn("relative mt-2.5", className)}>
      <div className="flex h-9 items-stretch gap-1.5">
        {inCart ? (
          <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-full border border-[#2f5d50]/30 bg-[#2f5d50] text-white">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={isPending}
              onClick={onMinus}
              className="flex h-full w-8 shrink-0 items-center justify-center hover:bg-black/10 disabled:opacity-50"
            >
              <Minus className="size-3.5" strokeWidth={2} />
            </button>
            <span className="min-w-0 flex-1 text-center text-[12px] font-semibold tabular-nums">
              {isPending ? "…" : totalQty}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={
                isPending ||
                (primaryLine != null &&
                  !needsPick &&
                  primaryLine.quantity >= primaryLine.availableStock)
              }
              onClick={onPlus}
              className="flex h-full w-8 shrink-0 items-center justify-center hover:bg-black/10 disabled:opacity-50"
            >
              <Plus className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={inStock.length === 0 || isPending}
            onClick={onClickAdd}
            className={cn(
              "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-2 text-[11px] font-medium tracking-wide transition",
              inStock.length === 0
                ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                : "bg-[#8b2e2e] text-white hover:bg-[#7a2727]",
            )}
          >
            {inStock.length === 0 ? (
              "Out of stock"
            ) : isPending ? (
              "Adding…"
            ) : (
              <>
                <ShoppingBag className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">Add</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          disabled={inStock.length === 0 || isPending}
          onClick={onClickBuy}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border-2 px-2 text-[11px] font-semibold tracking-wide transition",
            inStock.length === 0
              ? "cursor-not-allowed border-neutral-100 text-neutral-400"
              : "border-[#8b2e2e] bg-white text-[#8b2e2e] hover:bg-[#8b2e2e] hover:text-white",
          )}
        >
          <Zap className="size-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">
            {isPending ? "…" : "Buy now"}
          </span>
        </button>
      </div>

      {pickerMode && needsPick ? (
        <div className="absolute right-0 bottom-full left-0 z-30 mb-1.5 max-h-48 overflow-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          <p className="mb-1.5 px-1 text-[10px] tracking-wide text-neutral-500 uppercase">
            {pickerMode === "buy"
              ? "Choose size to buy"
              : "Choose size / option"}
          </p>
          <div className="space-y-1.5">
            {inStock.map((variant) => {
              const line = cartLines.find((l) => l.variantId === variant.id);
              if (pickerMode === "buy") {
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={isPending}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      buyVariant(variant.id);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] text-neutral-800 hover:bg-[#8b2e2e]/5"
                  >
                    <span className="truncate">{variant.label}</span>
                    <span className="shrink-0 text-[#8b2e2e]">Buy</span>
                  </button>
                );
              }
              return (
                <div
                  key={variant.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5"
                >
                  <span className="min-w-0 truncate text-[11px] text-neutral-800">
                    {variant.label}
                  </span>
                  {line ? (
                    <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-[#2f5d50]/25 bg-[#2f5d50] text-white">
                      <button
                        type="button"
                        disabled={isPending}
                        className="flex size-7 items-center justify-center hover:bg-black/10"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setLineQty(line, line.quantity - 1);
                        }}
                      >
                        <Minus className="size-3" strokeWidth={2} />
                      </button>
                      <span className="w-6 text-center text-[11px] font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={
                          isPending || line.quantity >= line.availableStock
                        }
                        className="flex size-7 items-center justify-center hover:bg-black/10 disabled:opacity-40"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setLineQty(line, line.quantity + 1);
                        }}
                      >
                        <Plus className="size-3" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        addVariant(variant.id);
                      }}
                      className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] text-neutral-800 hover:border-[#8b2e2e] hover:text-[#8b2e2e]"
                    >
                      Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

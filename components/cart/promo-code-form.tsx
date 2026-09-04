"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ChevronDown, Tag, X } from "lucide-react";
import { applyCoupon, removeCoupon } from "@/actions/cart/apply-coupon";
import { cn, formatCurrency } from "@/lib/utils";

export type AvailablePromo = {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number | null;
};

type PromoCodeFormProps = {
  appliedCode?: string | null;
  discount?: number;
  subtotal?: number;
  availablePromos?: AvailablePromo[];
};

function promoHeadline(promo: AvailablePromo) {
  if (promo.discountType === "PERCENTAGE") {
    return `${promo.discountValue}% off`;
  }
  return `${formatCurrency(promo.discountValue)} off`;
}

export function PromoCodeForm({
  appliedCode = null,
  discount = 0,
  subtotal = 0,
  availablePromos = [],
}: PromoCodeFormProps) {
  const [open, setOpen] = useState(!appliedCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isApplied = Boolean(appliedCode && discount > 0);

  const applyCode = (nextCode: string) => {
    const normalized = nextCode.trim().toUpperCase();
    if (!normalized) {
      setError("Enter a promo code");
      return;
    }

    setError(null);
    setPendingCode(normalized);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("code", normalized);

      const result = await applyCoupon(formData);
      setPendingCode(null);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setCode("");
      setOpen(false);
    });
  };

  const handleApply = (event: FormEvent) => {
    event.preventDefault();
    applyCode(code);
  };

  const handleRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeCoupon();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setOpen(true);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-base text-neutral-900">
          Apply Coupon code / Promo Code
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-neutral-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {isApplied && !open ? (
        <div className="border-t border-neutral-100 px-4 pb-4">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                <Tag className="size-3.5 shrink-0" />
                <span className="truncate font-mono tracking-wide">
                  {appliedCode}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-green-700">
                You save {formatCurrency(discount)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="rounded-full p-1.5 text-green-800 hover:bg-green-100 disabled:opacity-50"
              aria-label="Remove promo"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="space-y-3 border-t border-neutral-100 px-4 pb-4 pt-3">
          {isApplied ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                  <Tag className="size-3.5 shrink-0" />
                  <span className="truncate font-mono tracking-wide">
                    {appliedCode}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-green-700">
                  You save {formatCurrency(discount)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isPending}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApply}>
              <div className="relative">
                <input
                  id="promo-code"
                  name="code"
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  placeholder="Enter coupon code"
                  className="h-11 w-full rounded-lg border border-neutral-200 bg-white py-2 pr-24 pl-3 font-mono text-sm uppercase tracking-wide text-neutral-900 placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[#8b2e2e]/60 focus:outline-none focus:ring-2 focus:ring-[#8b2e2e]/20 disabled:opacity-50"
                  disabled={isPending}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isPending || !code.trim()}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-[#c47a7a] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#b56a6a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pendingCode && pendingCode === code.trim().toUpperCase()
                    ? "…"
                    : "Apply"}
                </button>
              </div>
            </form>
          )}

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          {availablePromos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                Available offers
              </p>
              {availablePromos.map((promo) => {
                const meetsMinimum = subtotal >= promo.minimumOrderValue;
                const isCurrent = appliedCode === promo.code;
                const isThisPending = pendingCode === promo.code;

                return (
                  <div
                    key={promo.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-base font-semibold tracking-wide text-neutral-900 uppercase">
                        {promo.code}
                      </p>
                      <p className="mt-0.5 text-xs text-[#8b2e2e]">
                        {promo.description || promoHeadline(promo)}
                      </p>
                      {!meetsMinimum ? (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Min. order{" "}
                          {formatCurrency(promo.minimumOrderValue)}
                        </p>
                      ) : promo.maximumDiscount ? (
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Max save {formatCurrency(promo.maximumDiscount)}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyCode(promo.code)}
                      disabled={
                        isPending || isCurrent || (!meetsMinimum && !isCurrent)
                      }
                      className={cn(
                        "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                        isCurrent
                          ? "bg-green-700"
                          : "bg-[#8b2e2e] hover:bg-[#732626]",
                      )}
                    >
                      {isCurrent
                        ? "Applied"
                        : isThisPending
                          ? "…"
                          : "Apply"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-neutral-500">
              No live promo codes right now. Enter a code above if you have
              one.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

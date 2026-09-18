import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary as CartSummaryType } from "@/types/cart";
import { AlertTriangle, ShoppingBag, Truck } from "lucide-react";
import {
  PromoCodeForm,
  type AvailablePromo,
} from "@/components/cart/promo-code-form";

type CartSummaryProps = {
  summary: CartSummaryType;
  availablePromos?: AvailablePromo[];
  /** When set, checkout is blocked (e.g. out-of-stock lines). */
  stockIssue?: string | null;
};

export function CartSummary({
  summary,
  availablePromos = [],
  stockIssue = null,
}: CartSummaryProps) {
  const checkoutBlocked = Boolean(stockIssue);

  return (
    <div className="rounded-xl border p-6">
      <h2 className="mb-4 font-serif text-lg font-semibold text-[#8b2e2e]">
        Order Summary
      </h2>

      <div className="mb-4">
        <PromoCodeForm
          appliedCode={summary.couponCode}
          discount={summary.discount}
          subtotal={summary.subtotal}
          availablePromos={availablePromos}
        />
      </div>

      <div className="space-y-3 text-sm">
        {summary.mrpTotal > summary.subtotal ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">MRP</span>
            <span className="text-muted-foreground line-through">
              {formatCurrency(summary.mrpTotal)}
            </span>
          </div>
        ) : null}

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Selling price ({summary.itemCount} items)
          </span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>

        {summary.productDiscount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>Discount on MRP</span>
            <span>-{formatCurrency(summary.productDiscount)}</span>
          </div>
        ) : null}

        {summary.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>
              Promo
              {summary.couponCode ? (
                <span className="ml-1 font-mono text-xs">
                  ({summary.couponCode})
                </span>
              ) : null}
            </span>
            <span>-{formatCurrency(summary.discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Tax (GST {summary.gstPercent}%)
          </span>
          <span>{formatCurrency(summary.tax)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {summary.shipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              formatCurrency(summary.shipping)
            )}
          </span>
        </div>

        {summary.giftPackaging > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gift packaging</span>
            <span>{formatCurrency(summary.giftPackaging)}</span>
          </div>
        ) : null}

        {summary.subtotal < summary.freeShippingThreshold && (
          <div className="flex items-center gap-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
            <Truck className="size-4" />
            Add{" "}
            {formatCurrency(summary.freeShippingThreshold - summary.subtotal)}{" "}
            more for FREE shipping
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(summary.total)}</span>
          </div>
          {summary.youSave > 0 ? (
            <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-800">
              You will save {formatCurrency(summary.youSave)} on this order
            </p>
          ) : null}
        </div>
      </div>

      {checkoutBlocked ? (
        <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
          <p>{stockIssue}</p>
        </div>
      ) : null}

      {checkoutBlocked ? (
        <Button
          size="lg"
          className="mt-6 w-full"
          disabled
          aria-disabled="true"
        >
          <ShoppingBag className="mr-2 size-5" />
          Proceed to Checkout
        </Button>
      ) : (
        <Button asChild size="lg" className="mt-6 w-full">
          <Link href="/checkout">
            <ShoppingBag className="mr-2 size-5" />
            Proceed to Checkout
          </Link>
        </Button>
      )}

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Secure checkout powered by Razorpay
      </div>
    </div>
  );
}

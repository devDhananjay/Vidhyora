import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary as CartSummaryType } from "@/types/cart";
import { ShoppingBag, Truck } from "lucide-react";
import {
  PromoCodeForm,
  type AvailablePromo,
} from "@/components/cart/promo-code-form";

type CartSummaryProps = {
  summary: CartSummaryType;
  availablePromos?: AvailablePromo[];
};

export function CartSummary({
  summary,
  availablePromos = [],
}: CartSummaryProps) {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>

      <div className="mb-4">
        <PromoCodeForm
          appliedCode={summary.couponCode}
          discount={summary.discount}
          subtotal={summary.subtotal}
          availablePromos={availablePromos}
        />
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Subtotal ({summary.itemCount} items)
          </span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>

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
          <span className="text-muted-foreground">Tax (GST 18%)</span>
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

        {summary.subtotal < 500 && (
          <div className="flex items-center gap-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
            <Truck className="size-4" />
            Add {formatCurrency(500 - summary.subtotal)} more for FREE shipping
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(summary.total)}</span>
          </div>
        </div>
      </div>

      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/checkout">
          <ShoppingBag className="mr-2 size-5" />
          Proceed to Checkout
        </Link>
      </Button>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        Secure checkout powered by Razorpay
      </div>
    </div>
  );
}

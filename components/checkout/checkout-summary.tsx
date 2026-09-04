"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary } from "@/types/cart";
import { ShieldCheck } from "lucide-react";
import {
  confirmRazorpayOrder,
  createOrder,
} from "@/actions/orders/create-order";

type CheckoutSummaryProps = {
  summary: CartSummary;
  itemCount: number;
  selectedAddressId?: string;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window unavailable"));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay")),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function CheckoutSummary({
  summary,
  itemCount,
  selectedAddressId,
}: CheckoutSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(
    "RAZORPAY",
  );

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("addressId", selectedAddressId);
      formData.append("paymentMethod", paymentMethod);

      const result = await createOrder(formData);

      if (!result.success) {
        alert(result.error);
        return;
      }

      if (paymentMethod === "COD") {
        if (!result.data?.orderId) {
          alert("Failed to create order");
          return;
        }
        router.push(`/orders/${result.data.orderId}?success=true`);
        router.refresh();
        return;
      }

      if (!result.data?.razorpayOrderId) {
        alert("Online payment could not start. Please try Cash on Delivery.");
        return;
      }

      try {
        await loadRazorpayScript();
      } catch {
        alert("Could not open Razorpay. Please try again or use Cash on Delivery.");
        return;
      }

      const options = {
        key: result.data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(result.data.amount * 100),
        currency: "INR",
        name: "VIDYORA",
        description: "Jewellery order",
        order_id: result.data.razorpayOrderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const confirmed = await confirmRazorpayOrder({
            addressId: selectedAddressId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (confirmed.success) {
            router.push(`/orders/${confirmed.data.orderId}?success=true`);
            router.refresh();
          } else {
            alert(confirmed.error);
          }
        },
        modal: {
          ondismiss: () => {
            alert("Payment cancelled. Your cart is still saved.");
          },
        },
        theme: {
          color: "#8b2e2e",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        alert("Payment failed. Your cart is still saved — try again or use COD.");
      });
      razorpay.open();
    });
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Price Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Price ({itemCount} items)
          </span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>

        {summary.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>
              Promo discount
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
          <span className="text-muted-foreground">Delivery Charges</span>
          <span>
            {summary.shipping === 0 ? (
              <span className="text-green-600 line-through">
                {formatCurrency(50)}
              </span>
            ) : (
              formatCurrency(summary.shipping)
            )}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax (GST 18%)</span>
          <span>{formatCurrency(summary.tax)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="mb-1 flex justify-between text-base font-semibold">
            <span>Total Amount</span>
            <span>{formatCurrency(summary.total)}</span>
          </div>
          {summary.shipping === 0 && (
            <p className="text-xs text-green-600">
              You saved {formatCurrency(50)} on delivery!
            </p>
          )}
        </div>
      </div>

      <div className="my-6 space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="payment"
            value="RAZORPAY"
            checked={paymentMethod === "RAZORPAY"}
            onChange={() => setPaymentMethod("RAZORPAY")}
            className="size-4"
          />
          <span className="text-sm">Online Payment (Razorpay)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            className="size-4"
          />
          <span className="text-sm">Cash on Delivery</span>
        </label>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={handlePlaceOrder}
        disabled={isPending || !selectedAddressId}
      >
        {isPending
          ? "Processing..."
          : paymentMethod === "COD"
            ? "Place COD order"
            : "Pay with Razorpay"}
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        Cart stays until payment succeeds or you place a COD order
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary } from "@/types/cart";
import { ShieldCheck } from "lucide-react";
import { createOrder } from "@/actions/orders/create-order";

type CheckoutSummaryProps = {
  summary: CartSummary;
  itemCount: number;
  selectedAddressId?: string;
};

declare global {
  interface Window {
    Razorpay: any;
  }
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

      if (paymentMethod === "RAZORPAY" && result.data?.razorpayOrderId) {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: Math.round(result.data!.amount * 100),
            currency: "INR",
            name: "VIDYORA",
            description: `Order #${result.data!.orderNumber}`,
            order_id: result.data!.razorpayOrderId,
            handler: async (response: any) => {
              // Payment success - verify on server
              const verifyResponse = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: result.data!.orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyResponse.ok) {
                router.push(`/orders/${result.data!.orderId}?success=true`);
              } else {
                alert("Payment verification failed");
              }
            },
            prefill: {
              name: "",
              email: "",
              contact: "",
            },
            theme: {
              color: "#3B82F6",
            },
          };

          const razorpay = new window.Razorpay(options);
          razorpay.open();
        };
      } else {
        // COD order
        router.push(`/orders/${result.data?.orderId}?success=true`);
      }
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

      {/* Payment Method Selection */}
      <div className="my-6 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
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
        <label className="flex items-center gap-3 cursor-pointer">
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
        {isPending ? "Processing..." : "Place Order"}
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" />
        Safe and secure payments
      </div>
    </div>
  );
}

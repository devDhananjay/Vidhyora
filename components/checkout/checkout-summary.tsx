"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary } from "@/types/cart";
import { ShieldCheck } from "lucide-react";
import {
  confirmRazorpayOrder,
  createOrder,
} from "@/actions/orders/create-order";
import {
  codUnavailableMessage,
  isCodAvailableForPincode,
} from "@/lib/shipping/cod";

type AddressLite = {
  id: string;
  postalCode: string;
};

type CheckoutSummaryProps = {
  summary: CartSummary;
  itemCount: number;
  selectedAddressId?: string;
  addresses?: AddressLite[];
  codEnabled?: boolean;
  giftNotesEnabled?: boolean;
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
  addresses = [],
  codEnabled = true,
  giftNotesEnabled = true,
}: CheckoutSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(
    "RAZORPAY",
  );
  const [hidePriceOnInvoice, setHidePriceOnInvoice] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [occasionNote, setOccasionNote] = useState("");

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId],
  );
  const codAvailable =
    codEnabled && isCodAvailableForPincode(selectedAddress?.postalCode);

  useEffect(() => {
    if (!codAvailable && paymentMethod === "COD") {
      setPaymentMethod("RAZORPAY");
    }
  }, [codAvailable, paymentMethod]);

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }
    if (paymentMethod === "COD" && !codAvailable) {
      alert(codUnavailableMessage(selectedAddress?.postalCode));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("addressId", selectedAddressId);
      formData.append("paymentMethod", paymentMethod);
      formData.append(
        "hidePriceOnInvoice",
        hidePriceOnInvoice ? "true" : "false",
      );
      if (giftMessage.trim()) {
        formData.append("giftMessage", giftMessage.trim());
      }
      if (occasionNote.trim()) {
        formData.append("occasionNote", occasionNote.trim());
      }

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
        alert(
          "Could not open Razorpay. Please try again or use Cash on Delivery.",
        );
        return;
      }

      const options = {
        key:
          result.data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
            hidePriceOnInvoice,
            giftMessage: giftMessage.trim() || undefined,
            occasionNote: occasionNote.trim() || undefined,
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
        alert(
          "Payment failed. Your cart is still saved — try again or use COD.",
        );
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
            Subtotal ({itemCount} items)
          </span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>

        {summary.discount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>-{formatCurrency(summary.discount)}</span>
          </div>
        ) : null}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {summary.shipping === 0 ? (
              <span className="text-green-600 line-through">
                {formatCurrency(summary.shippingFee)}
              </span>
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

        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Tax (GST {summary.gstPercent}%)
          </span>
          <span>{formatCurrency(summary.tax)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="mb-1 flex justify-between text-base font-semibold">
            <span>Total Amount</span>
            <span>{formatCurrency(summary.total)}</span>
          </div>
          {summary.shipping === 0 && (
            <p className="text-xs text-green-600">
              You saved {formatCurrency(summary.shippingFee)} on delivery!
            </p>
          )}
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 size-4"
          checked={hidePriceOnInvoice}
          onChange={(event) => setHidePriceOnInvoice(event.target.checked)}
        />
        <span className="text-sm leading-5">
          <span className="font-medium text-neutral-900">
            Gift invoice (hide prices)
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Printable invoice will hide amounts — useful for gifts.
          </span>
        </span>
      </label>

      {giftNotesEnabled ? (
      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="occasionNote"
            className="text-sm font-medium text-neutral-900"
          >
            Occasion
          </label>
          <input
            id="occasionNote"
            type="text"
            value={occasionNote}
            onChange={(event) => setOccasionNote(event.target.value)}
            maxLength={200}
            placeholder="Birthday, anniversary, wedding…"
            className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
        </div>
        <div>
          <label
            htmlFor="giftMessage"
            className="text-sm font-medium text-neutral-900"
          >
            Gift message
          </label>
          <textarea
            id="giftMessage"
            value={giftMessage}
            onChange={(event) => setGiftMessage(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Optional note for the recipient"
            className="mt-1.5 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on the order and invoice when provided.
          </p>
        </div>
      </div>
      ) : null}

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
        <label
          className={`flex items-center gap-3 ${
            codAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          }`}
        >
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            disabled={!codAvailable}
            onChange={() => setPaymentMethod("COD")}
            className="size-4"
          />
          <span className="text-sm">
            Cash on Delivery
            {!codEnabled ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Cash on Delivery is currently unavailable
              </span>
            ) : !codAvailable && selectedAddressId ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {codUnavailableMessage(selectedAddress?.postalCode)}
              </span>
            ) : null}
          </span>
        </label>
      </div>

      <Button
        size="lg"
        className="mt-2 w-full"
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

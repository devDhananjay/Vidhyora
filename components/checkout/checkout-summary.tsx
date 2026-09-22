"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { CartSummary } from "@/types/cart";
import { ShieldCheck, Zap } from "lucide-react";
import {
  confirmRazorpayOrder,
  createOrder,
} from "@/actions/orders/create-order";
import {
  codUnavailableMessage,
  isCodAvailableForPincode,
} from "@/lib/shipping/cod";
import { calculateCartSummary } from "@/lib/cart/cart-utils";
import type { CartWithItems } from "@/types/cart";
import { appAlert } from "@/components/shared/app-dialog";
import type { GuestAddressDraft } from "@/components/checkout/guest-address-form";

type AddressLite = {
  id: string;
  postalCode: string;
};

type CheckoutSummaryProps = {
  summary: CartSummary;
  cart?: CartWithItems;
  itemCount: number;
  selectedAddressId?: string;
  guestAddress?: GuestAddressDraft;
  addresses?: AddressLite[];
  codEnabled?: boolean;
  giftNotesEnabled?: boolean;
  buyNowItemId?: string;
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
  summary: initialSummary,
  cart,
  itemCount,
  selectedAddressId,
  guestAddress,
  addresses = [],
  codEnabled = true,
  giftNotesEnabled = true,
  buyNowItemId,
}: CheckoutSummaryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(
    "RAZORPAY",
  );
  const [hidePriceOnInvoice, setHidePriceOnInvoice] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [occasionNote, setOccasionNote] = useState("");
  const [fastDelivery, setFastDelivery] = useState(false);

  const summary = useMemo(() => {
    if (!cart) return initialSummary;
    return calculateCartSummary(cart, {
      discount: initialSummary.discount,
      couponCode: initialSummary.couponCode,
      freeShippingThreshold: initialSummary.freeShippingThreshold,
      shippingFee: initialSummary.shippingFee,
      fastDeliveryFee: initialSummary.fastDeliveryFee,
      fastDeliveryEnabled: initialSummary.fastDeliveryEnabled,
      useFastDelivery: fastDelivery,
      gstPercent: initialSummary.gstPercent,
    });
  }, [cart, initialSummary, fastDelivery]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId],
  );
  const checkoutPincode =
    selectedAddress?.postalCode || guestAddress?.postalCode || "";
  const codAvailable =
    codEnabled && isCodAvailableForPincode(checkoutPincode);

  useEffect(() => {
    if (!codAvailable && paymentMethod === "COD") {
      setPaymentMethod("RAZORPAY");
    }
  }, [codAvailable, paymentMethod]);

  const handlePlaceOrder = async () => {
    const usingGuest = Boolean(guestAddress);
    if (!usingGuest && !selectedAddressId) {
      await appAlert("Please select a delivery address");
      return;
    }
    if (usingGuest) {
      if (
        !guestAddress?.fullName?.trim() ||
        !guestAddress?.email?.trim() ||
        !guestAddress?.phone?.trim() ||
        !guestAddress?.line1?.trim() ||
        !guestAddress?.city?.trim() ||
        !guestAddress?.state?.trim() ||
        !guestAddress?.postalCode?.trim()
      ) {
        await appAlert("Please fill in your delivery details");
        return;
      }
    }
    if (paymentMethod === "COD" && !codAvailable) {
      await appAlert(codUnavailableMessage(checkoutPincode));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (selectedAddressId) {
        formData.append("addressId", selectedAddressId);
      }
      if (guestAddress) {
        formData.append("guestFullName", guestAddress.fullName);
        formData.append("guestEmail", guestAddress.email);
        formData.append("guestPhone", guestAddress.phone);
        formData.append("guestLine1", guestAddress.line1);
        formData.append("guestLine2", guestAddress.line2 || "");
        formData.append("guestCity", guestAddress.city);
        formData.append("guestState", guestAddress.state);
        formData.append("guestPostalCode", guestAddress.postalCode);
        formData.append("guestCountry", "IN");
      }
      formData.append("paymentMethod", paymentMethod);
      formData.append(
        "hidePriceOnInvoice",
        hidePriceOnInvoice ? "true" : "false",
      );
      formData.append("fastDelivery", fastDelivery ? "true" : "false");
      if (giftMessage.trim()) {
        formData.append("giftMessage", giftMessage.trim());
      }
      if (occasionNote.trim()) {
        formData.append("occasionNote", occasionNote.trim());
      }
      if (buyNowItemId) {
        formData.append("buyNowItemId", buyNowItemId);
      }

      const result = await createOrder(formData);

      if (!result.success) {
        await appAlert(result.error, { variant: "error" });
        return;
      }

      if (paymentMethod === "COD") {
        if (!result.data?.orderId) {
          await appAlert("Failed to create order", { variant: "error" });
          return;
        }
        if (usingGuest && result.data.orderNumber) {
          router.push(
            `/order-confirmed?n=${encodeURIComponent(result.data.orderNumber)}`,
          );
        } else {
          router.push(`/orders/${result.data.orderId}?success=true`);
        }
        router.refresh();
        return;
      }

      if (!result.data?.razorpayOrderId) {
        await appAlert(
          "Online payment could not start. Please try Cash on Delivery.",
          { variant: "error" },
        );
        return;
      }

      const payAddressId = result.data.addressId || selectedAddressId;
      if (!payAddressId) {
        await appAlert("Delivery address missing for payment", {
          variant: "error",
        });
        return;
      }

      try {
        await loadRazorpayScript();
      } catch {
        await appAlert(
          "Could not open Razorpay. Please try again or use Cash on Delivery.",
          { variant: "error" },
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
        prefill: guestAddress
          ? {
              name: guestAddress.fullName,
              email: guestAddress.email,
              contact: guestAddress.phone,
            }
          : undefined,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const confirmed = await confirmRazorpayOrder({
            addressId: payAddressId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            hidePriceOnInvoice,
            giftMessage: giftMessage.trim() || undefined,
            occasionNote: occasionNote.trim() || undefined,
            fastDelivery,
            buyNowItemId,
          });
          if (confirmed.success) {
            if (usingGuest && confirmed.data.orderNumber) {
              router.push(
                `/order-confirmed?n=${encodeURIComponent(confirmed.data.orderNumber)}`,
              );
            } else {
              router.push(`/orders/${confirmed.data.orderId}?success=true`);
            }
            router.refresh();
          } else {
            await appAlert(confirmed.error, { variant: "error" });
          }
        },
        modal: {
          ondismiss: () => {
            void appAlert("Payment cancelled. Your cart is still saved.");
          },
        },
        theme: {
          color: "#8b2e2e",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        void appAlert(
          "Payment failed. Your cart is still saved — try again or use COD.",
          { variant: "error" },
        );
      });
      razorpay.open();
    });
  };

  const standardShipping =
    summary.subtotal >= summary.freeShippingThreshold ? 0 : summary.shippingFee;

  return (
    <div className="rounded-xl border p-6">
      <h2 className="mb-4 font-serif text-xl text-brand md:text-2xl">Price Summary</h2>

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
            Selling price ({itemCount} items)
          </span>
          <span>{formatCurrency(summary.subtotal)}</span>
        </div>

        {summary.productDiscount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>Discount on MRP</span>
            <span>-{formatCurrency(summary.productDiscount)}</span>
          </div>
        ) : null}

        {summary.discount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>
              Coupon
              {summary.couponCode ? (
                <span className="ml-1 font-mono text-xs">
                  ({summary.couponCode})
                </span>
              ) : null}
            </span>
            <span>-{formatCurrency(summary.discount)}</span>
          </div>
        ) : null}

        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {standardShipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              formatCurrency(standardShipping)
            )}
          </span>
        </div>

        {fastDelivery && summary.fastDeliveryEnabled ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fast delivery</span>
            <span>{formatCurrency(summary.fastDeliveryFee)}</span>
          </div>
        ) : null}

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
          {summary.youSave > 0 ? (
            <p className="rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-800">
              You will save {formatCurrency(summary.youSave)} on this order
            </p>
          ) : null}
        </div>
      </div>

      {summary.fastDeliveryEnabled ? (
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#8b2e2e]/25 bg-[#8b2e2e]/5 px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[#8b2e2e]"
            checked={fastDelivery}
            onChange={(event) => setFastDelivery(event.target.checked)}
          />
          <span className="text-sm leading-5">
            <span className="inline-flex items-center gap-1.5 font-medium text-neutral-900">
              <Zap className="size-3.5 text-[#8b2e2e]" />
              Fast delivery
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Priority shipping for{" "}
              {formatCurrency(summary.fastDeliveryFee)} extra — faster dispatch.
            </span>
          </span>
        </label>
      ) : null}

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-[#8b2e2e]"
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
              className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
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
              className="mt-1.5 w-full resize-y rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400"
            />
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
            className="size-4 accent-[#8b2e2e]"
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
            className="size-4 accent-[#8b2e2e]"
          />
          <span className="text-sm">
            Cash on Delivery
            {!codEnabled ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Cash on Delivery is currently unavailable
              </span>
            ) : !codAvailable && checkoutPincode ? (
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {codUnavailableMessage(checkoutPincode)}
              </span>
            ) : null}
          </span>
        </label>
      </div>

      <Button
        size="lg"
        className="mt-2 w-full"
        onClick={handlePlaceOrder}
        disabled={
          isPending || (!selectedAddressId && !guestAddress)
        }
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

import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Options | VIDYORA",
  description:
    "Pay for VIDYORA jewellery with UPI, cards, net banking, wallets via Razorpay, or Cash on Delivery.",
};

const METHODS = [
  {
    icon: Smartphone,
    title: "UPI",
    text: "Google Pay, PhonePe, BHIM and other UPI apps through Razorpay. The order is created only after the payment is verified.",
  },
  {
    icon: CreditCard,
    title: "Cards",
    text: "Visa, Mastercard, RuPay and American Express. VIDYORA never stores your full card number — Razorpay handles the charge.",
  },
  {
    icon: Wallet,
    title: "Net banking & wallets",
    text: "Major Indian banks and supported wallets appear on the Razorpay checkout sheet. Use the same method later if you need a refund.",
  },
  {
    icon: Banknote,
    title: "Cash on Delivery",
    text: "Available on eligible pin codes. The order is placed immediately. Payment stays PENDING (COD) until the seller marks it delivered.",
  },
];

export default function PaymentOptionsPage() {
  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          Checkout
        </p>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900 sm:text-4xl md:text-5xl">
          Payment Options
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Every jewellery order on VIDYORA is either paid online through Razorpay
          or collected as Cash on Delivery. Choose at checkout after you pick a
          delivery address.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {METHODS.map((method) => (
            <div
              key={method.title}
              className="rounded-2xl border border-neutral-100 bg-white p-6"
            >
              <method.icon
                className="size-6 text-[#8b2e2e]"
                strokeWidth={1.5}
              />
              <h2 className="mt-4 font-serif text-xl text-neutral-900">
                {method.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {method.text}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-14 space-y-5 text-[15px] leading-7 text-neutral-700">
          <h2 className="font-serif text-2xl text-neutral-900">
            How online payment works
          </h2>
          <p>
            Select <strong>Online Payment (Razorpay)</strong> on the order
            summary. You are taken to Razorpay to complete UPI, card, net banking
            or wallet. The shop order is created only after the signature is
            verified. If you close the sheet or the charge fails, your cart stays
            as it is — try again, or switch to COD.
          </p>

          <h2 className="font-serif text-2xl text-neutral-900">
            How Cash on Delivery works
          </h2>
          <p>
            Select <strong>Cash on Delivery</strong> and place the order. Stock is
            reserved, and you can track packing from{" "}
            <Link href={ROUTES.orders} className="text-[#8b2e2e] underline">
              My Orders
            </Link>
            . Keep the billed amount ready in cash or UPI as the courier accepts.
            Payment becomes PAID (COD) when the seller marks the order delivered.
            Refused COD parcels are cancelled; nothing is collected at the door,
            so there is no refund.
          </p>

          <h2 className="font-serif text-2xl text-neutral-900">
            Delivery fee and offers
          </h2>
          <p>
            Orders of ₹500 and above ship free inside India. Below that, ₹50 is
            added at checkout. Active coupon codes and contest rules are listed
            on{" "}
            <Link href={ROUTES.offers} className="text-[#8b2e2e] underline">
              Offers &amp; Contest Details
            </Link>
            .
          </p>

          <h2 className="font-serif text-2xl text-neutral-900">Refunds</h2>
          <p>
            Approved returns on Razorpay orders go back to the original UPI,
            card, net banking or wallet. COD refunds, when a paid-and-delivered
            piece is returned, are processed as advised by support. See{" "}
            <Link href={ROUTES.returns} className="text-[#8b2e2e] underline">
              Returns
            </Link>{" "}
            for eligibility.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[#8b2e2e]/15 bg-white p-6">
          <ShieldCheck className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
          <p className="flex-1 text-sm text-neutral-600">
            Card data never sits on VIDYORA servers. Checkout is encrypted and
            the cart is kept until payment succeeds or you place a COD order.
          </p>
          <Button asChild className="rounded-full px-6">
            <Link href={ROUTES.cart}>Go to cart</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

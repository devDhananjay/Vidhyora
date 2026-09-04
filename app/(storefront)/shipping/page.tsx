import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Delivery Information | VIDYORA",
  description: "Shipping, delivery timelines and international dispatch for VIDYORA jewellery.",
};

export default function ShippingPage() {
  return (
    <ContentPage eyebrow="Orders" title="Delivery Information">
      <p>
        VIDYORA ships gold, diamond and fine jewellery across India with insured
        courier partners. Orders of ₹500 and above have free delivery. Below that,
        a ₹50 shipping fee is added at checkout.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">India</h2>
      <p>
        Most metro cities receive parcels in 3–5 working days after the seller
        marks the order shipped. Other pin codes typically take 5–8 working days.
        You can follow packing and courier updates from{" "}
        <Link href={ROUTES.orders} className="text-[#8b2e2e] underline">
          Track your Order
        </Link>
        .
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">Cash on Delivery</h2>
      <p>
        COD is available on eligible pin codes. Payment stays pending until the
        order is delivered. Please keep the billed amount ready in cash or UPI
        as accepted by the courier.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">International shipping</h2>
      <p>
        Cross-border dispatch is arranged case by case for select destinations.
        Duties, taxes and jewellery export paperwork are charged extra. Write to{" "}
        <a href="mailto:support@vidyora.com" className="text-[#8b2e2e] underline">
          support@vidyora.com
        </a>{" "}
        with your city and product list, or visit a boutique via the{" "}
        <Link href={ROUTES.storeLocator} className="text-[#8b2e2e] underline">
          Store Locator
        </Link>
        .
      </p>
    </ContentPage>
  );
}

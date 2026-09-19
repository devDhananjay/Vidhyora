import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Delivery Information | VIDYORA",
  description:
    "Shipping, delivery timelines and international enquire-only support for VIDYORA jewellery.",
  alternates: { canonical: "/shipping" },
};

export default async function ShippingPage() {
  const [settings, commerce] = await Promise.all([
    getSiteSettings(),
    getCommerceSettings(),
  ]);
  const { supportEmail } = settings.contact;
  const threshold = formatCurrency(commerce.freeShippingThreshold);
  const fee = formatCurrency(commerce.shippingFee);

  return (
    <ContentPage eyebrow="Orders" title="Delivery Information">
      <p>
        VIDYORA ships gold, diamond and fine jewellery across India with insured
        courier partners. Orders of {threshold} and above have free delivery.
        Below that, a {fee} shipping fee is added at checkout.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">India</h2>
      <p>
        Checkout supports India delivery addresses only. Most metro cities
        receive parcels in 3–5 working days after the seller marks the order
        shipped. Other pin codes typically take 5–8 working days. You can follow
        packing and courier updates from{" "}
        <Link href={ROUTES.orders} className="text-[#8b2e2e] underline">
          Track your Order
        </Link>
        .
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">Cash on Delivery</h2>
      <p>
        {commerce.codEnabled
          ? "COD is available on eligible pin codes when enabled in commerce settings. Payment stays pending until the order is delivered. Please keep the billed amount ready in cash or UPI as accepted by the courier."
          : "Cash on Delivery is currently unavailable. Please complete checkout with online payment."}
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">
        International orders
      </h2>
      {commerce.internationalShippingEnabled ? (
        <p>
          Online checkout is India-only. International shipping is enquire-only —
          we do not take cross-border payment or address at checkout. Duties,
          taxes and jewellery export paperwork are quoted separately. Write to{" "}
          <a
            href={`mailto:${supportEmail}?subject=International%20shipping%20enquiry`}
            className="text-[#8b2e2e] underline"
          >
            {supportEmail}
          </a>{" "}
          with your destination city and product list, or visit a boutique via the{" "}
          <Link href={ROUTES.storeLocator} className="text-[#8b2e2e] underline">
            Store Locator
          </Link>
          .
        </p>
      ) : (
        <p>
          International shipping is not available right now. Checkout accepts
          India delivery addresses only. For boutique pickup options, see the{" "}
          <Link href={ROUTES.storeLocator} className="text-[#8b2e2e] underline">
            Store Locator
          </Link>
          .
        </p>
      )}
    </ContentPage>
  );
}

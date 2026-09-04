import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Returns | VIDYORA",
  description: "Return and replacement policy for VIDYORA jewellery.",
};

export default function ReturnsPolicyPage() {
  return (
    <ContentPage eyebrow="Orders" title="Returns & Replacements">
      <p>
        You may request a return or replacement on delivered jewellery within the
        window shown on the product page, as long as the piece is unused and in
        original packaging with tags and certificates.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">How to raise a request</h2>
      <p>
        Open{" "}
        <Link href={ROUTES.orders} className="text-[#8b2e2e] underline">
          My Orders
        </Link>
        , choose the delivered item, and submit a return or replacement with
        photos if asked. Super Admin reviews the request. Approved returns restore
        stock; paid orders are refunded to the original payment method.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">What cannot be returned</h2>
      <p>
        Customised, engraved or made-to-order pieces, and jewellery showing wear,
        are not eligible. COD orders that are refused at the door are cancelled
        without a refund, because no payment was collected.
      </p>
      <p>
        Need help deciding? See{" "}
        <Link href={ROUTES.help} className="text-[#8b2e2e] underline">
          Help & FAQs
        </Link>{" "}
        or call 1800-123-4567.
      </p>
    </ContentPage>
  );
}

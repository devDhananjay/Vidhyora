import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About VIDYORA | Contact",
  description: "About VIDYORA jewellery and how to reach our advisors.",
};

export default function ContactPage() {
  return (
    <ContentPage eyebrow="VIDYORA" title="About & Contact">
      <p>
        VIDYORA is a jewellery marketplace for gold, diamond and festive
        collections. Independent seller admins list certified pieces; Super Admin
        approves catalogues, KYC and payouts so every boutique meets the same
        quality bar.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">Talk to us</h2>
      <p>
        Phone:{" "}
        <a href="tel:1800-123-4567" className="text-[#8b2e2e] underline">
          1800-123-4567
        </a>
        <br />
        Email:{" "}
        <a href="mailto:support@vidyora.com" className="text-[#8b2e2e] underline">
          support@vidyora.com
        </a>
        <br />
        WhatsApp:{" "}
        <a
          href="https://wa.me/918147349242"
          className="text-[#8b2e2e] underline"
        >
          +91 81473 49242
        </a>
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">Visit a boutique</h2>
      <p>
        Try gold colour, size and wedding sets in person. Addresses and hours are
        on the{" "}
        <Link href={ROUTES.storeLocator} className="text-[#8b2e2e] underline">
          Store Locator
        </Link>
        . Partner jewellers can apply from{" "}
        <Link href={ROUTES.partner} className="text-[#8b2e2e] underline">
          Partner with Us
        </Link>
        .
      </p>
    </ContentPage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import {
  phoneTelHref,
  whatsappHref,
} from "@/lib/content/site-settings-defaults";

export const metadata: Metadata = {
  title: "About VIDYORA | Contact",
  description: "About VIDYORA jewellery and how to reach our advisors.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { supportEmail, supportPhone, whatsappNumber } = settings.contact;

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
        <a href={phoneTelHref(supportPhone)} className="text-[#8b2e2e] underline">
          {supportPhone}
        </a>
        <br />
        Email:{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="text-[#8b2e2e] underline"
        >
          {supportEmail}
        </a>
        <br />
        WhatsApp:{" "}
        <a
          href={whatsappHref(whatsappNumber)}
          className="text-[#8b2e2e] underline"
        >
          {supportPhone}
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

import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy & Cookies | VIDYORA",
  description: "How VIDYORA uses account, order and cookie data.",
};

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Legal" title="Privacy & Cookie Policy">
      <p>
        VIDYORA uses your account, address and order data to process jewellery
        purchases, COD, Razorpay payments, returns and seller payouts. We do not
        store full card numbers; online charges go through Razorpay.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">What we keep</h2>
      <p>
        Name, email, phone, delivery address, order history, KYC documents for
        seller admins, and messages you send to support. Reviews you publish may
        appear on product pages after moderation.
      </p>
      <h2 className="font-serif text-2xl text-neutral-900">Cookies</h2>
      <p>
        Essential cookies keep you signed in, remember the cart and protect
        checkout. We do not sell cookie data. Clearing cookies signs you out and
        may empty a guest cart.
      </p>
      <p>
        Questions:{" "}
        <a href="mailto:support@vidyora.com" className="text-[#8b2e2e] underline">
          support@vidyora.com
        </a>
        {" · "}
        <Link href={ROUTES.help} className="text-[#8b2e2e] underline">
          Help
        </Link>
        {" · "}
        <Link href={ROUTES.contact} className="text-[#8b2e2e] underline">
          Contact
        </Link>
        .
      </p>
    </ContentPage>
  );
}

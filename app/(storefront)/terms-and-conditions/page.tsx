import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/content/get-site-settings";

export const metadata: Metadata = {
  title: "Terms & Conditions | VIDYORA",
  description:
    "Terms of use for shopping on VIDYORA — orders, payments, sellers, returns and account rules.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default async function TermsAndConditionsPage() {
  const settings = await getSiteSettings();
  const { supportEmail, supportPhone } = settings.contact;

  return (
    <ContentPage eyebrow="Legal" title="Terms & Conditions">
      <p className="text-sm text-neutral-500">
        Last updated: 9 September 2026
      </p>
      <p>
        Welcome to VIDYORA. These Terms &amp; Conditions (&quot;Terms&quot;)
        govern your use of vidyora.co.in and related services for browsing,
        buying and selling jewellery. By creating an account, placing an order
        or listing products as a seller, you agree to these Terms.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        1. About VIDYORA
      </h2>
      <p>
        VIDYORA is an online jewellery marketplace connecting customers with
        verified sellers. Product listings may be fulfilled by VIDYORA or by
        independent seller admins. Prices, availability and craftsmanship
        details are shown on each product page.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        2. Eligibility &amp; accounts
      </h2>
      <p>
        You must be legally capable of entering a contract under Indian law to
        use our services. You are responsible for keeping login credentials
        confidential and for activity under your account. Provide accurate name,
        email, phone and address details. We may suspend or disable accounts
        that are abusive, fraudulent or in breach of these Terms.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        3. Orders &amp; pricing
      </h2>
      <p>
        An order is an offer to buy. Acceptance is confirmed when we (or the
        relevant seller) accept and process the order. Prices are in INR unless
        stated otherwise and may change without notice for future orders.
        Product images are illustrative; minor variations in colour, finish or
        stone characteristics can occur with handmade jewellery. We may cancel
        an order for stock, pricing error, failed payment, delivery limits or
        suspected fraud, with a refund of any amount already paid online where
        applicable.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        4. Payments
      </h2>
      <p>
        We accept payment methods shown at checkout, including online payment
        via Razorpay and Cash on Delivery (COD) where available for your
        pincode. Online payment success is required before manufacturing /
        dispatch for prepaid orders. COD orders remain payable on delivery as
        per courier instructions. You agree not to reverse charge or dispute
        legitimate charges without first contacting{" "}
        <Link href={ROUTES.help} className="text-[#8b2e2e] underline">
          Help
        </Link>
        .
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        5. Shipping &amp; delivery
      </h2>
      <p>
        Delivery timelines are estimates and can vary by location, customisation
        and courier partner. Title and risk pass as described in our{" "}
        <Link href={ROUTES.shipping} className="text-[#8b2e2e] underline">
          Delivery Information
        </Link>{" "}
        page. Please ensure someone is available to receive insured jewellery
        parcels and verify the package before accepting where the courier
        allows.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        6. Returns, exchanges &amp; cancellations
      </h2>
      <p>
        Return and exchange eligibility depends on product type, seller policy
        and condition of the item. See{" "}
        <Link href={ROUTES.returns} className="text-[#8b2e2e] underline">
          Returns
        </Link>{" "}
        for the current process. Customised, engraved, made-to-order or hygiene-
        sensitive items may be non-returnable unless defective. Cancel before
        dispatch where the order status allows; after shipping, use the returns
        flow.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        7. Sellers
      </h2>
      <p>
        Seller admins must complete KYC, keep listings accurate, honour accepted
        orders, and follow platform policies on pricing, inventory and
        fulfilment. VIDYORA may withhold payouts, suspend listings or terminate
        seller access for policy breaches, fake reviews, counterfeit goods or
        customer harm. Commission rates are as agreed in the seller profile /
        agreement.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        8. Intellectual property
      </h2>
      <p>
        VIDYORA branding, site design, logos and content are protected. You may
        not copy, scrape or reuse our content or trademarks without permission.
        Sellers retain rights in their own product imagery and descriptions but
        grant VIDYORA a licence to display them for marketplace operations.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        9. Prohibited use
      </h2>
      <p>
        You must not misuse the site — including hacking, scraping at scale,
        posting unlawful content, impersonation, payment fraud, or interfering
        with other users&apos; accounts. We may remove content and take legal
        action where appropriate.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        10. Limitation of liability
      </h2>
      <p>
        To the fullest extent permitted by law, VIDYORA is not liable for
        indirect, incidental or consequential losses arising from use of the
        site, delays by courier partners, or actions of independent sellers,
        except where liability cannot be excluded under applicable Indian
        consumer law. Our aggregate liability for a claim relating to an order
        is limited to the amount you paid for that order.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        11. Governing law
      </h2>
      <p>
        These Terms are governed by the laws of India. Courts in India shall
        have jurisdiction, subject to mandatory consumer protection rights that
        may apply to you.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">12. Changes</h2>
      <p>
        We may revise these Terms periodically. The &quot;Last updated&quot;
        date will reflect changes. Continued use after an update constitutes
        acceptance of the revised Terms.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">13. Contact</h2>
      <p>
        Questions about these Terms:{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="text-[#8b2e2e] underline"
        >
          {supportEmail}
        </a>
        {supportPhone ? (
          <>
            {" · "}
            <a
              href={`tel:${supportPhone.replace(/\s+/g, "")}`}
              className="text-[#8b2e2e] underline"
            >
              {supportPhone}
            </a>
          </>
        ) : null}
        {" · "}
        <Link href={ROUTES.contact} className="text-[#8b2e2e] underline">
          Contact
        </Link>
        {" · "}
        <Link href={ROUTES.privacyPolicy} className="text-[#8b2e2e] underline">
          Privacy Policy
        </Link>
        .
      </p>
    </ContentPage>
  );
}

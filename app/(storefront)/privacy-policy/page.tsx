import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/storefront/content-page";
import { ROUTES } from "@/lib/constants";
import { getSiteSettings } from "@/lib/content/get-site-settings";

export const metadata: Metadata = {
  title: "Privacy Policy | VIDYORA",
  description:
    "How VIDYORA collects, uses and protects your personal data for jewellery orders, accounts and seller services.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const { supportEmail, supportPhone } = settings.contact;

  return (
    <ContentPage eyebrow="Legal" title="Privacy Policy">
      <p className="text-sm text-neutral-500">
        Last updated: 9 September 2026
      </p>
      <p>
        This Privacy Policy explains how VIDYORA (&quot;we&quot;, &quot;us&quot;,
        &quot;our&quot;) collects, uses, stores and shares personal information
        when you browse vidyora.co.in, create an account, place an order, join as
        a seller, or contact support. By using our website and services, you
        agree to this policy.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        1. Information we collect
      </h2>
      <p>We may collect:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Account data</strong> — name, email, phone, password (stored
          as a secure hash), and profile details.
        </li>
        <li>
          <strong>Order &amp; delivery data</strong> — shipping addresses,
          pincode, order history, returns and payment status.
        </li>
        <li>
          <strong>Payment-related data</strong> — payment method chosen (UPI,
          card via Razorpay, COD, etc.). We do not store full card numbers;
          card and UPI processing is handled by Razorpay or the courier for COD.
        </li>
        <li>
          <strong>Seller / KYC data</strong> — business name, GST, PAN, bank
          details and KYC documents uploaded for verification.
        </li>
        <li>
          <strong>Support &amp; reviews</strong> — messages you send us and
          product reviews you publish.
        </li>
        <li>
          <strong>Technical data</strong> — device/browser type, IP address,
          cookies and similar technologies needed for login, cart and security.
        </li>
      </ul>

      <h2 className="font-serif text-2xl text-neutral-900">
        2. How we use your information
      </h2>
      <p>We use personal data to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Process, pack, ship and track jewellery orders.</li>
        <li>Manage accounts, wishlists, returns and refunds.</li>
        <li>Verify seller KYC and calculate commissions / payouts.</li>
        <li>Prevent fraud, abuse and unauthorised access.</li>
        <li>
          Send order updates and, where permitted, offers or service messages.
        </li>
        <li>Improve site performance, search and customer support.</li>
      </ul>

      <h2 className="font-serif text-2xl text-neutral-900">
        3. Cookies
      </h2>
      <p>
        Essential cookies keep you signed in, remember your cart and protect
        checkout. We do not sell cookie data to third parties. Clearing cookies
        may sign you out and empty a guest cart. For more detail see this page
        together with our site Cookie information in the footer.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        4. Sharing of information
      </h2>
      <p>
        We share data only as needed to run the marketplace — for example with
        courier partners for delivery, Razorpay for online payments, and sellers
        for fulfilling your order (name, address, phone and order items). We do
        not sell your personal information. We may disclose information if
        required by law or to protect VIDYORA, our users or the public.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        5. Data retention &amp; security
      </h2>
      <p>
        We keep account and order records for as long as needed for legal,
        tax, dispute and service reasons. Passwords are hashed. Access to
        seller KYC and admin tools is restricted to authorised staff. No method
        of transmission over the internet is 100% secure; we take reasonable
        safeguards but cannot guarantee absolute security.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        6. Your choices
      </h2>
      <p>
        You can update profile and address details from{" "}
        <Link href={ROUTES.account} className="text-[#8b2e2e] underline">
          Account Settings
        </Link>
        . You may request account-related corrections or support via the
        contact details below. Some data must be retained for completed orders
        and compliance.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        7. Children
      </h2>
      <p>
        VIDYORA is intended for users who can form a legally binding contract
        under Indian law. We do not knowingly collect personal data from
        children for marketplace accounts.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">
        8. Changes
      </h2>
      <p>
        We may update this Privacy Policy from time to time. The &quot;Last
        updated&quot; date at the top will change when we do. Continued use of
        the site after changes means you accept the revised policy.
      </p>

      <h2 className="font-serif text-2xl text-neutral-900">9. Contact</h2>
      <p>
        Privacy questions:{" "}
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
        <Link href={ROUTES.help} className="text-[#8b2e2e] underline">
          Help
        </Link>
        {" · "}
        <Link
          href={ROUTES.termsAndConditions}
          className="text-[#8b2e2e] underline"
        >
          Terms &amp; Conditions
        </Link>
        .
      </p>
    </ContentPage>
  );
}

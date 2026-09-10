import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { APP_NAME, ROUTES } from "@/lib/constants";
import {
  phoneTelHref,
  whatsappHref,
} from "@/lib/content/site-settings-defaults";
import type { SiteSettingsData } from "@/lib/validations/site-settings";

const USEFUL_LINKS = [
  { href: ROUTES.shipping, label: "Delivery Information" },
  { href: ROUTES.shipping, label: "International Shipping" },
  { href: ROUTES.paymentOptions, label: "Payment Options" },
  { href: ROUTES.orders, label: "Track your Order" },
  { href: ROUTES.returns, label: "Returns" },
  { href: ROUTES.storeLocator, label: "Find a Store" },
];

const INFO_LINKS = [
  { href: ROUTES.blog, label: "Blog" },
  { href: ROUTES.offers, label: "Offers & Contest Details" },
  { href: ROUTES.help, label: "Help & FAQs" },
  { href: ROUTES.contact, label: "About VIDYORA" },
  { href: ROUTES.privacyPolicy, label: "Privacy Policy" },
  { href: ROUTES.termsAndConditions, label: "Terms & Conditions" },
];

type SiteFooterProps = {
  settings: SiteSettingsData;
};

export function SiteFooter({ settings }: SiteFooterProps) {
  const { contact, social } = settings;
  const tel = phoneTelHref(contact.supportPhone);
  const wa = whatsappHref(contact.whatsappNumber);
  const socialLinks = [
    {
      label: "Instagram",
      href: social.instagram,
      path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9ZM17.3 6.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z",
    },
    {
      label: "X",
      href: social.twitter,
      path: "M4 5h4.3l4 5.4L16.8 5H20l-6.2 7.6L20 19h-4.3l-4.3-5.7L7.2 19H4l6.5-7.8Z",
    },
    {
      label: "Facebook",
      href: social.facebook,
      path: "M14 8h2.5V5h-2.7C11.4 5 10 6.6 10 9.1V11H8v3h2v6h3v-6h2.4l.6-3H13V9.3c0-.8.3-1.3 1-1.3Z",
    },
    {
      label: "YouTube",
      href: social.youtube,
      path: "M22 8.2a3 3 0 0 0-2.1-2.1C18.2 5.7 12 5.7 12 5.7s-6.2 0-7.9.4A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.7.4 7.9.4 7.9.4s6.2 0 7.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.4 12 31 31 0 0 0 22 8.2ZM10 15.2V8.8L16 12Z",
    },
  ].filter((item) => item.href);

  return (
    <footer className="bg-[#3b0f14] text-[#f4ece6] print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid items-start gap-10 md:grid-cols-[200px_1fr_1fr_1fr] md:gap-8 lg:gap-12">
          <div className="flex justify-start md:-ml-1 md:self-center">
            <BrandLogo size="lg" className="h-36 w-36 md:h-44 md:w-44" />
          </div>

          <FooterColumn title="Useful Links" links={USEFUL_LINKS} />
          <FooterColumn title="Information" links={INFO_LINKS} />

          <div>
            <h3 className="mb-5 font-serif text-[22px]">Contact Us</h3>
            <a href={tel} className="text-sm tracking-wide hover:text-white">
              {contact.supportPhone}
            </a>
            <a
              href={`mailto:${contact.supportEmail}`}
              className="mt-2 block text-sm tracking-wide hover:text-white"
            >
              {contact.supportEmail}
            </a>
            <h3 className="mt-7 mb-5 font-serif text-[22px]">Chat With Us</h3>
            <a href={wa} className="text-sm tracking-wide hover:text-white">
              {contact.supportPhone}
            </a>
            <div className="mt-5 flex gap-3">
              <CircleIcon href={wa} label="WhatsApp">
                <MessageCircle className="size-4" strokeWidth={1.6} />
              </CircleIcon>
              <CircleIcon
                href={`mailto:${contact.supportEmail}`}
                label="Email"
              >
                <Mail className="size-4" strokeWidth={1.6} />
              </CircleIcon>
              <CircleIcon href={ROUTES.help} label="Live chat">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 fill-current"
                  aria-hidden
                >
                  <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" />
                </svg>
              </CircleIcon>
            </div>
          </div>
        </div>

        {socialLinks.length > 0 ? (
          <div className="mt-12 flex flex-wrap items-center gap-5 border-t border-white/15 pt-7">
            <p className="font-serif text-[22px]">Social</p>
            <div className="flex gap-3">
              {socialLinks.map((item) => (
                <SocialIcon
                  key={item.label}
                  label={item.label}
                  href={item.href}
                >
                  <path d={item.path} />
                </SocialIcon>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-white/15 pt-7 text-white">
          <VisaMark />
          <MastercardMark />
          <MaestroMark />
          <PayPalMark />
          <UpiMark />
          <AmexMark />
        </div>

        <p className="mt-10 text-xs tracking-wide text-white/45">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-5 font-serif text-[22px]">{title}</h3>
      <ul className="space-y-3 text-[13px] tracking-wide text-[#f4ece6]/80">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="transition hover:text-white hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CircleIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
    >
      {children}
    </Link>
  );
}

function SocialIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
    >
      <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
        {children}
      </svg>
    </a>
  );
}

function VisaMark() {
  return (
    <svg
      viewBox="0 0 48 16"
      className="h-4 w-auto fill-current"
      aria-label="Visa"
    >
      <path d="M18.2 1.4 15.3 14.6h-3.3L14.9 1.4h3.3Zm13.8 8.6 1.8-4.9.2-.8.8 4.2.6 1.5h-3.4Zm4.9 4.6h3.1L37.2 1.4h-2.8c-.7 0-1.2.4-1.5 1L28.4 14.6h3.4l.6-1.7h4.2l.3 1.7Zm-7.9-8.5c.1-1.3-1.2-2.1-3.3-2.2-1.4 0-2.7.3-3.4.7l.6 2.6c.7-.4 1.7-.7 2.5-.7.8 0 1.2.3 1.2.6 0 .4-.4.6-1.3.9-1.9.6-2.8 1.6-2.8 3.1 0 1.9 1.6 3 3.9 3 1.2 0 2.2-.2 2.9-.5l-.6-2.6c-.6.3-1.5.6-2.3.6-.7 0-1.2-.2-1.2-.7 0-.3.3-.5 1.2-.8 1.8-.6 2.9-1.5 2.9-3Zm-16.4 8.5 2.7-13.2H14L11 10.3 9.8 4.1c-.2-.8-.8-1.5-1.7-1.8L3.4 1.4l-.1.3C4.8 2.2 6 3.2 6.7 4.5l3.7 10.1h3.4l5.2-13.2h-3.2l-3.2 8.5Z" />
    </svg>
  );
}

function MastercardMark() {
  return (
    <svg viewBox="0 0 40 24" className="h-6 w-auto" aria-label="Mastercard">
      <circle cx="15" cy="12" r="8" fill="currentColor" opacity="0.85" />
      <circle cx="25" cy="12" r="8" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function MaestroMark() {
  return (
    <span className="text-[11px] tracking-[0.18em]" aria-label="Maestro">
      MAESTRO
    </span>
  );
}

function PayPalMark() {
  return (
    <span className="font-serif text-sm tracking-wide" aria-label="PayPal">
      PayPal
    </span>
  );
}

function UpiMark() {
  return (
    <span className="text-[11px] tracking-[0.2em]" aria-label="UPI">
      UPI
    </span>
  );
}

function AmexMark() {
  return (
    <span
      className="rounded border border-white/50 px-1.5 py-0.5 text-[10px] tracking-[0.16em]"
      aria-label="American Express"
    >
      AMEX
    </span>
  );
}

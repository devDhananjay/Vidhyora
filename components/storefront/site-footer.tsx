import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { APP_NAME, ROUTES } from "@/lib/constants";

const USEFUL_LINKS = [
  { href: "/shipping", label: "Delivery Information" },
  { href: "/shipping", label: "International Shipping" },
  { href: "/checkout", label: "Payment Options" },
  { href: ROUTES.orders, label: "Track your Order" },
  { href: "/returns", label: "Returns" },
  { href: "/store-locator", label: "Find a Store" },
];

const INFO_LINKS = [
  { href: "/help", label: "Blog" },
  { href: "/help", label: "Offers & Contest Details" },
  { href: "/help", label: "Help & FAQs" },
  { href: "/contact", label: "About VIDYORA" },
  { href: "/privacy", label: "Cookie Policy" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#3b0f14] text-[#f4ece6]">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <p className="mb-10 font-serif text-[34px] tracking-[0.16em]">{APP_NAME}</p>

        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <p className="font-serif text-[22px] leading-snug">
              Download the {APP_NAME} App Now
            </p>
            <div className="relative mt-5 size-[148px] bg-white p-2.5">
              <div
                className="size-full"
                style={{
                  backgroundImage:
                    "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
                  backgroundSize: "7px 7px",
                }}
                aria-hidden
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1 font-serif text-xs tracking-[0.12em] text-[#3b0f14]">
                {APP_NAME}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <StoreBadge
                label="GET IT ON"
                store="Google Play"
                icon={
                  <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                    <path d="M3.6 2.3 13.8 12 3.6 21.7A1.8 1.8 0 0 1 3 20.2V3.8a1.8 1.8 0 0 1 .6-1.5Zm11.1 10.6 2.3 2.2-9.5 5.5 7.2-7.7Zm2.3-4.8 2.4 1.4a1.8 1.8 0 0 1 0 3.1l-2.4 1.4L14.7 12l2.3-3.9ZM7.5 3.4l9.5 5.5-2.3 2.2-7.2-7.7Z" />
                  </svg>
                }
              />
              <StoreBadge
                label="Download on the"
                store="App Store"
                icon={
                  <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                    <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1.1 1-2.1 1-2.2-.1 0-2.3-.9-2.3-3.1ZM14.6 6.4c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3Z" />
                  </svg>
                }
              />
            </div>
          </div>

          <FooterColumn title="Useful Links" links={USEFUL_LINKS} />
          <FooterColumn title="Information" links={INFO_LINKS} />

          <div>
            <h3 className="mb-3 font-serif text-[22px]">Contact Us</h3>
            <a href="tel:1800-123-4567" className="text-sm tracking-wide hover:text-white">
              1800-123-4567
            </a>
            <h3 className="mt-7 mb-3 font-serif text-[22px]">Chat With Us</h3>
            <a
              href="https://wa.me/918147349242"
              className="text-sm tracking-wide hover:text-white"
            >
              +91 81473 49242
            </a>
            <div className="mt-5 flex gap-3">
              <CircleIcon href="https://wa.me/918147349242" label="WhatsApp">
                <MessageCircle className="size-4" strokeWidth={1.6} />
              </CircleIcon>
              <CircleIcon href="mailto:support@vidyora.com" label="Email">
                <Mail className="size-4" strokeWidth={1.6} />
              </CircleIcon>
              <CircleIcon href="/help" label="Live chat">
                <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                  <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" />
                </svg>
              </CircleIcon>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-5 border-t border-white/15 pt-7">
          <p className="font-serif text-[22px]">Social</p>
          <div className="flex gap-3">
            <SocialIcon label="Instagram">
              <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5Zm0 7.4A2.9 2.9 0 1 1 14.9 12 2.9 2.9 0 0 1 12 14.9ZM17.3 6.2a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z" />
            </SocialIcon>
            <SocialIcon label="X">
              <path d="M4 5h4.3l4 5.4L16.8 5H20l-6.2 7.6L20 19h-4.3l-4.3-5.7L7.2 19H4l6.5-7.8Z" />
            </SocialIcon>
            <SocialIcon label="Facebook">
              <path d="M14 8h2.5V5h-2.7C11.4 5 10 6.6 10 9.1V11H8v3h2v6h3v-6h2.4l.6-3H13V9.3c0-.8.3-1.3 1-1.3Z" />
            </SocialIcon>
            <SocialIcon label="YouTube">
              <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18.2 5.7 12 5.7 12 5.7s-6.2 0-7.9.4A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12a31 31 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.7.4 7.9.4 7.9.4s6.2 0 7.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.4 12 31 31 0 0 0 22 8.2ZM10 15.2V8.8L16 12Z" />
            </SocialIcon>
          </div>
        </div>

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
            <Link href={link.href} className="transition hover:text-white hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoreBadge({
  label,
  store,
  icon,
}: {
  label: string;
  store: string;
  icon: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-[138px] items-center gap-2 rounded-md border border-white/35 px-2.5 py-1.5">
      {icon}
      <span className="leading-tight">
        <span className="block text-[8px] tracking-wide text-white/70">{label}</span>
        <span className="block text-[11px] font-medium">{store}</span>
      </span>
    </span>
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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href="#"
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
    <svg viewBox="0 0 48 16" className="h-4 w-auto fill-current" aria-label="Visa">
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
    <span className="rounded border border-white/50 px-1.5 py-0.5 text-[10px] tracking-[0.16em]" aria-label="American Express">
      AMEX
    </span>
  );
}

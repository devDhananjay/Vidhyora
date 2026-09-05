import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { getPublicOffers } from "@/actions/content/get-offers";
import { CONTESTS } from "@/lib/content/contests";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offers & Contest Details | VIDYORA",
  description:
    "Live coupon codes, festival contests and boutique lucky draws at VIDYORA.",
};

function couponHeadline(offer: {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: { toString(): string };
}) {
  const value = Number(offer.discountValue);
  if (offer.discountType === "PERCENTAGE") return `${value}% off`;
  return `${formatCurrency(value)} off`;
}

const STATUS_CLASS = {
  Open: "bg-[#8b2e2e] text-white",
  Upcoming: "bg-[#f6ead7] text-[#8b2e2e]",
  Closed: "bg-neutral-200 text-neutral-600",
} as const;

export default async function OffersPage() {
  const offers = await getPublicOffers();

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          Campaigns
        </p>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900 sm:text-4xl md:text-5xl">
          Offers & Contest Details
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Coupon codes below are live in the VIDYORA catalogue. Super Admin can
          add or pause them anytime. Contests have their own windows and rules.
        </p>

        <h2 className="mt-12 font-serif text-3xl text-neutral-900">
          Live coupon codes
        </h2>
        {offers.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">
            No coupons are running right now. Check this page again during
            festival weeks, or write to{" "}
            <a
              href="mailto:support@vidyora.com"
              className="text-[#8b2e2e] underline"
            >
              support@vidyora.com
            </a>
            .
          </p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex flex-col rounded-2xl border border-neutral-100 bg-white p-6"
              >
                <Tag className="size-5 text-[#8b2e2e]" strokeWidth={1.5} />
                <p className="mt-3 font-serif text-2xl text-neutral-900">
                  {couponHeadline(offer)}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {offer.description || "Jewellery order discount"}
                </p>
                <p className="mt-4 rounded-md bg-[#faf8f6] px-3 py-2 font-mono text-sm tracking-wide text-[#8b2e2e]">
                  {offer.code}
                </p>
                <ul className="mt-4 space-y-1 text-xs leading-5 text-neutral-500">
                  <li>
                    Min. order {formatCurrency(Number(offer.minimumOrderValue))}
                  </li>
                  {offer.maximumDiscount ? (
                    <li>
                      Max saving {formatCurrency(Number(offer.maximumDiscount))}
                    </li>
                  ) : null}
                  <li>
                    {offer.perUserLimit} use
                    {offer.perUserLimit === 1 ? "" : "s"} per customer
                  </li>
                  <li>
                    Valid until{" "}
                    {offer.expiryDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </li>
                </ul>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-sm leading-6 text-neutral-600">
          Mention the code while placing the order, or to{" "}
          <a
            href="mailto:support@vidyora.com"
            className="text-[#8b2e2e] underline"
          >
            support@vidyora.com
          </a>{" "}
          if you need it applied. Coupons do not combine. They cannot be used on
          already discounted contest prizes. See{" "}
          <Link href={ROUTES.paymentOptions} className="text-[#8b2e2e] underline">
            Payment Options
          </Link>{" "}
          for how Razorpay and COD work with the final billed amount.
        </p>

        <h2 className="mt-14 font-serif text-3xl text-neutral-900">Contests</h2>
        <div className="mt-6 space-y-5">
          {CONTESTS.map((contest) => (
            <article
              key={contest.id}
              className="rounded-2xl border border-neutral-100 bg-white p-6 md:p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-serif text-2xl text-neutral-900">
                  {contest.title}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs tracking-wide ${STATUS_CLASS[contest.status]}`}
                >
                  {contest.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-500">{contest.window}</p>
              <p className="mt-4 text-[15px] leading-7 text-neutral-700">
                <strong>Prize: </strong>
                {contest.prize}
              </p>
              <h4 className="mt-5 text-sm font-medium text-neutral-900">
                How to enter
              </h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-neutral-600">
                {contest.howToEnter.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h4 className="mt-5 text-sm font-medium text-neutral-900">
                Rules
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-neutral-600">
                {contest.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild className="rounded-full px-6">
            <Link href={ROUTES.products}>Shop jewellery</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href={ROUTES.storeLocator}>Find a boutique</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

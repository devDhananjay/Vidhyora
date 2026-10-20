"use client";

import Image from "next/image";
import {
  FESTIVAL_CAMPAIGNS,
  getFestivalCampaignStatus,
  type FestivalCampaign,
  type FestivalCampaignStatus,
} from "@/lib/content/festival-banners";
import { cn } from "@/lib/utils";

function formatIstRange(from: string, until: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  };
  const a = new Date(from).toLocaleDateString("en-IN", opts);
  const b = new Date(until).toLocaleDateString("en-IN", opts);
  return `${a} → ${b}`;
}

function statusLabel(status: FestivalCampaignStatus) {
  if (status === "live") return "Live on storefront";
  if (status === "upcoming") return "Upcoming";
  return "Ended";
}

function statusClass(status: FestivalCampaignStatus) {
  if (status === "live") return "bg-emerald-100 text-emerald-800";
  if (status === "upcoming") return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-500";
}

function couponSummary(campaign: FestivalCampaign) {
  const c = campaign.coupon;
  if (c.discountType === "PERCENTAGE") {
    return `${c.code} · ${c.discountValue}% off (max ₹${c.maximumDiscount}) · min ₹${c.minimumOrderValue}`;
  }
  return `${c.code} · ₹${c.discountValue} off · min ₹${c.minimumOrderValue}`;
}

/**
 * Read-only calendar festival hero banners for Admin → Homepage → Hero.
 * These auto-appear on the storefront during their window and create coupons.
 */
export function FestivalHeroBannersPanel() {
  return (
    <div className="space-y-4 rounded-xl border border-[#ead9c4] bg-[#faf7f5] p-4">
      <div>
        <p className="text-sm font-semibold text-[#8b2e2e]">
          Auto festival banners
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Hindu festival heroes are calendar-managed. Live ones show first on
          the homepage (with &quot;Vidyora by Vidushi&quot; branding) and their
          coupon codes are created automatically. Manual banners below still
          rotate after these.
        </p>
      </div>

      <div className="grid gap-3">
        {FESTIVAL_CAMPAIGNS.map((campaign) => {
          const status = getFestivalCampaignStatus(campaign);
          const title =
            campaign.slide.titleLines?.filter(Boolean).join(" ") ||
            campaign.festival;
          return (
            <div
              key={campaign.id}
              className="overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              <div className="grid gap-0 sm:grid-cols-[200px_1fr]">
                <div className="relative aspect-[16/9] bg-neutral-100 sm:aspect-auto sm:min-h-[112px]">
                  <Image
                    src={campaign.slide.image}
                    alt={campaign.slide.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 200px"
                    unoptimized
                  />
                </div>
                <div className="space-y-2 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-neutral-900">
                      {campaign.festival} · {title}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase",
                        statusClass(status),
                      )}
                    >
                      {statusLabel(status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatIstRange(campaign.visibleFrom, campaign.visibleUntil)}{" "}
                    (IST)
                  </p>
                  <p className="text-xs font-medium text-neutral-700">
                    {couponSummary(campaign)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Slide id: {campaign.slide.id} · CTA: {campaign.slide.cta} →{" "}
                    {campaign.slide.ctaHref}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

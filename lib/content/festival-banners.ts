import { shopHref } from "@/lib/nav/mega-menu-data";
import type { HomepageHeroSlide } from "@/lib/validations/homepage";

/**
 * Margin-safe festival campaigns for the homepage hero.
 *
 * Catalogue is typically ₹149–₹800, so discounts stay tiny and capped:
 * - percentage ≤ 10%, max save ≤ ₹100
 * - fixed ≤ ₹75, always with min order ₹499+
 * - per-user limit 1, global usage caps
 */
export type FestivalCouponDef = {
  code: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount: number;
  usageLimit: number;
  perUserLimit: number;
};

export type FestivalCampaign = {
  id: string;
  festival: string;
  visibleFrom: string; // ISO with offset
  visibleUntil: string;
  coupon: FestivalCouponDef;
  slide: HomepageHeroSlide;
};

/** Hard guard — never allow loss-making banner coupons to ship. */
export function assertMarginSafeCoupon(coupon: FestivalCouponDef) {
  if (coupon.minimumOrderValue < 499) {
    throw new Error(`${coupon.code}: min order must be ≥ ₹499`);
  }
  if (coupon.perUserLimit < 1) {
    throw new Error(`${coupon.code}: per-user limit required`);
  }
  if (coupon.discountType === "PERCENTAGE") {
    if (coupon.discountValue > 10) {
      throw new Error(`${coupon.code}: percentage cannot exceed 10%`);
    }
    if (coupon.maximumDiscount > 100) {
      throw new Error(`${coupon.code}: max discount cannot exceed ₹100`);
    }
  } else {
    if (coupon.discountValue > 75) {
      throw new Error(`${coupon.code}: flat off cannot exceed ₹75`);
    }
    if (coupon.maximumDiscount > 75) {
      throw new Error(`${coupon.code}: flat max cannot exceed ₹75`);
    }
  }
}

function slide(partial: HomepageHeroSlide): HomepageHeroSlide {
  return {
    layout: "overlay",
    ...partial,
  };
}

/**
 * Hindu festival windows (IST). Overlapping windows are OK — all active
 * slides are shown; coupons upsert independently.
 */
export const FESTIVAL_CAMPAIGNS: FestivalCampaign[] = [
  {
    id: "navratri-2026",
    festival: "Navratri",
    visibleFrom: "2026-10-02T00:00:00+05:30",
    visibleUntil: "2026-10-20T23:59:59+05:30",
    coupon: {
      code: "NAVRATRI75",
      description: "Navratri: ₹75 off on orders ₹799+ (margin-safe)",
      discountType: "FIXED",
      discountValue: 75,
      minimumOrderValue: 799,
      maximumDiscount: 75,
      usageLimit: 400,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-navratri-2026",
      image: "/images/banners/festival-navratri-banner.jpg?v=1",
      alt: "Navratri Mata Rani dotted-line art — Vidyora by Vidushi festive jewellery",
      panelColor: "#5c1f28",
      panelClassName: "left-[52%]",
      contentAlign: "right",
      eyebrow: "NAVRATRI EDIT",
      titleMode: "script",
      titleLines: ["Shubh Navratri"],
      subtitle: "Code NAVRATRI75 · ₹75 off on ₹799+",
      cta: "SHOP FESTIVE",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "Navratri Edit",
      }),
      ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      visibleFrom: "2026-10-02T00:00:00+05:30",
      visibleUntil: "2026-10-20T23:59:59+05:30",
    }),
  },
  {
    id: "dussehra-2026",
    festival: "Dussehra",
    visibleFrom: "2026-10-18T00:00:00+05:30",
    visibleUntil: "2026-10-21T23:59:59+05:30",
    coupon: {
      code: "DUSSEHRA50",
      description: "Dussehra: ₹50 off on orders ₹499+ (margin-safe)",
      discountType: "FIXED",
      discountValue: 50,
      minimumOrderValue: 499,
      maximumDiscount: 50,
      usageLimit: 300,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-dussehra-2026",
      image: "/images/banners/festival-dussehra-banner.jpg?v=1",
      alt: "Dussehra victory art — Vidyora by Vidushi festive jewellery",
      panelColor: "#3d5c48",
      panelClassName: "left-[52%]",
      contentAlign: "right",
      eyebrow: "VIJAYADASHAMI",
      titleMode: "stacked",
      titleLines: ["Victory", "sparkle"],
      subtitle: "Code DUSSEHRA50 · ₹50 off on ₹499+",
      cta: "SHOP NOW",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "Dussehra Special",
      }),
      ctaClassName: "bg-[#e9d9cc] text-[#8b2e2e] hover:bg-[#f0e4da]",
      visibleFrom: "2026-10-18T00:00:00+05:30",
      visibleUntil: "2026-10-21T23:59:59+05:30",
    }),
  },
  {
    id: "diwali-2026",
    festival: "Diwali",
    visibleFrom: "2026-10-28T00:00:00+05:30",
    visibleUntil: "2026-11-12T23:59:59+05:30",
    coupon: {
      code: "DIWALI10",
      description: "Diwali: 10% off (max ₹100) on ₹499+ (margin-safe)",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumOrderValue: 499,
      maximumDiscount: 100,
      usageLimit: 500,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-diwali-2026",
      image: "/images/banners/festival-diwali-banner.jpg?v=1",
      alt: "Diwali diya dotted-line art — Vidyora by Vidushi festive jewellery",
      panelColor: "#1a2744",
      panelClassName: "left-[50%]",
      contentAlign: "right-soft",
      eyebrow: "DIWALI DHAMAKA",
      titleMode: "serif",
      titleLines: ["Festival Of Lights"],
      subtitle: "Code DIWALI10 · 10% off (max ₹100) on ₹499+",
      cta: "CLAIM OFFER",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "Diwali Edit",
      }),
      ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      visibleFrom: "2026-10-28T00:00:00+05:30",
      visibleUntil: "2026-11-12T23:59:59+05:30",
    }),
  },
  {
    id: "christmas-2026",
    festival: "Christmas",
    visibleFrom: "2026-12-15T00:00:00+05:30",
    visibleUntil: "2026-12-26T23:59:59+05:30",
    coupon: {
      code: "XMAS75",
      description: "Christmas: ₹75 off on orders ₹799+ (margin-safe)",
      discountType: "FIXED",
      discountValue: 75,
      minimumOrderValue: 799,
      maximumDiscount: 75,
      usageLimit: 350,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-christmas-2026",
      image: "/images/banners/festival-christmas-banner.jpg?v=1",
      alt: "Christmas dotted-line tree art — Vidyora by Vidushi festive jewellery",
      panelColor: "#1f3d32",
      panelClassName: "left-[52%]",
      contentAlign: "right",
      eyebrow: "CHRISTMAS EDIT",
      titleMode: "script",
      titleLines: ["Merry & Bright"],
      subtitle: "Code XMAS75 · ₹75 off on ₹799+",
      cta: "GIFT NOW",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "Christmas Gifts",
      }),
      ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      visibleFrom: "2026-12-15T00:00:00+05:30",
      visibleUntil: "2026-12-26T23:59:59+05:30",
    }),
  },
  {
    id: "newyear-2027",
    festival: "New Year",
    visibleFrom: "2026-12-27T00:00:00+05:30",
    visibleUntil: "2027-01-05T23:59:59+05:30",
    coupon: {
      code: "NEWYEAR10",
      description: "New Year: 10% off (max ₹100) on ₹499+ (margin-safe)",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minimumOrderValue: 499,
      maximumDiscount: 100,
      usageLimit: 400,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-newyear-2027",
      image: "/images/banners/festival-newyear-banner.jpg?v=1",
      alt: "New Year fireworks dotted-line art — Vidyora by Vidushi festive jewellery",
      panelColor: "#1a2744",
      panelClassName: "left-[50%]",
      contentAlign: "right-soft",
      eyebrow: "NEW YEAR SPARKLE",
      titleMode: "serif",
      titleLines: ["Start In Style"],
      subtitle: "Code NEWYEAR10 · 10% off (max ₹100) on ₹499+",
      cta: "SHOP NEW YEAR",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "New Year Edit",
      }),
      ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      visibleFrom: "2026-12-27T00:00:00+05:30",
      visibleUntil: "2027-01-05T23:59:59+05:30",
    }),
  },
  {
    id: "holi-2027",
    festival: "Holi",
    visibleFrom: "2027-03-01T00:00:00+05:30",
    visibleUntil: "2027-03-05T23:59:59+05:30",
    coupon: {
      code: "HOLI75",
      description: "Holi: ₹75 off on orders ₹799+ (margin-safe)",
      discountType: "FIXED",
      discountValue: 75,
      minimumOrderValue: 799,
      maximumDiscount: 75,
      usageLimit: 300,
      perUserLimit: 1,
    },
    slide: slide({
      id: "festival-holi-2027",
      image: "/images/banners/festival-holi-banner.jpg?v=1",
      alt: "Holi pastel dotted-line art — Vidyora by Vidushi festive jewellery",
      panelColor: "#7a3d5c",
      panelClassName: "left-[52%]",
      contentAlign: "right",
      eyebrow: "HOLI SPECIAL",
      titleMode: "script",
      titleLines: ["Rang & Shine"],
      subtitle: "Code HOLI75 · ₹75 off on ₹799+",
      cta: "SHOP COLOUR",
      ctaHref: shopHref({
        occasion: "festive",
        collection: "Holi Edit",
      }),
      ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      visibleFrom: "2027-03-01T00:00:00+05:30",
      visibleUntil: "2027-03-05T23:59:59+05:30",
    }),
  },
];

// Validate at module load so unsafe campaigns never reach production.
for (const campaign of FESTIVAL_CAMPAIGNS) {
  assertMarginSafeCoupon(campaign.coupon);
}

export function getActiveFestivalCampaigns(now: Date = new Date()) {
  const t = now.getTime();
  return FESTIVAL_CAMPAIGNS.filter((campaign) => {
    const from = new Date(campaign.visibleFrom).getTime();
    const until = new Date(campaign.visibleUntil).getTime();
    return t >= from && t <= until;
  });
}

export type FestivalCampaignStatus = "live" | "upcoming" | "ended";

export function getFestivalCampaignStatus(
  campaign: Pick<FestivalCampaign, "visibleFrom" | "visibleUntil">,
  now: Date = new Date(),
): FestivalCampaignStatus {
  const t = now.getTime();
  const from = new Date(campaign.visibleFrom).getTime();
  const until = new Date(campaign.visibleUntil).getTime();
  if (t < from) return "upcoming";
  if (t > until) return "ended";
  return "live";
}

/** Festival hero slides are calendar-managed — never persist them in CMS JSON. */
export function stripFestivalHeroSlides(
  slides: HomepageHeroSlide[],
): HomepageHeroSlide[] {
  return slides.filter((slide) => !slide.id.startsWith("festival-"));
}

export function getActiveFestivalHeroSlides(
  now: Date = new Date(),
): HomepageHeroSlide[] {
  return getActiveFestivalCampaigns(now).map((campaign) => campaign.slide);
}

export function mergeFestivalHeroSlides(
  cmsSlides: HomepageHeroSlide[],
  now: Date = new Date(),
): HomepageHeroSlide[] {
  const festivalSlides = getActiveFestivalHeroSlides(now);
  const festivalIds = new Set(festivalSlides.map((s) => s.id));
  const rest = stripFestivalHeroSlides(cmsSlides).filter(
    (slide) => !festivalIds.has(slide.id),
  );
  return [...festivalSlides, ...rest];
}

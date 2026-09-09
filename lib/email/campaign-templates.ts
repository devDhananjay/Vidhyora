import { wrapBrandEmail } from "@/lib/email/brand-layout";
import { getEmailAppUrl, escapeHtml, textToHtml } from "@/lib/email/app-url";

export type CampaignType = "WELCOME" | "DROPOUT" | "OFFER" | "FESTIVAL";

export type CampaignCopy = {
  subject: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  couponCode?: string;
  footnote?: string;
};

export const FESTIVAL_PRESETS: Record<
  string,
  { label: string } & CampaignCopy
> = {
  diwali: {
    label: "Diwali",
    subject: "Shubh Deepavali from VIDYORA",
    eyebrow: "Festival of lights",
    headline: "May your home shine brighter than gold",
    body: "This Diwali, celebrate with jewellery that carries light, blessing and craft. Explore festive sets, gifts for family, and pieces made to be worn for years of celebrations.",
    ctaLabel: "Shop Diwali jewels",
    ctaUrl: "/offers",
    footnote: "Wishing you prosperity, warmth and a luminous year ahead.",
  },
  eid: {
    label: "Eid",
    subject: "EID MUBARAK from VIDYORA",
    eyebrow: "Eid greetings",
    headline: "A celebration of grace and gathering",
    body: "Eid Mubarak. Mark the day with jewellery that feels as generous as the occasion — gifts for loved ones, and pieces that honour tradition with a contemporary touch.",
    ctaLabel: "Find an Eid gift",
    ctaUrl: "/products",
    footnote: "Warm wishes to you and your family.",
  },
  akshaya: {
    label: "Akshaya Tritiya",
    subject: "Akshaya Tritiya — an auspicious day for gold",
    eyebrow: "Akshaya Tritiya",
    headline: "Begin something that never diminishes",
    body: "Akshaya Tritiya is the day to invest in lasting beauty. Discover gold that holds meaning — for you, for family, for the years ahead.",
    ctaLabel: "Shop auspicious gold",
    ctaUrl: "/products",
  },
  karva: {
    label: "Karva Chauth",
    subject: "Karva Chauth — jewellery for a night of devotion",
    eyebrow: "Karva Chauth",
    headline: "Dressed in love, lit by the moon",
    body: "For the fast, the wait, and the first glimpse of the moon — choose jewellery that feels ceremonial and intimate. A gift, or a piece you have been saving for this night.",
    ctaLabel: "Shop Karva looks",
    ctaUrl: "/products",
  },
  wedding: {
    label: "Wedding season",
    subject: "Wedding season at VIDYORA",
    eyebrow: "Wedding atelier",
    headline: "For every phera, every blessing, every photograph",
    body: "Bridal sets, family jewels and gifts for the wedding party — crafted to look as considered in person as they do in memory.",
    ctaLabel: "Explore bridal jewellery",
    ctaUrl: "/products",
  },
  newyear: {
    label: "New Year",
    subject: "A luminous New Year from VIDYORA",
    eyebrow: "New year",
    headline: "Step into the year wearing something unforgettable",
    body: "New year, new sparkle. Thank you for letting VIDYORA be part of your celebrations. Here is to more occasions, more gifting, and jewellery you will reach for again.",
    ctaLabel: "Start the year in gold",
    ctaUrl: "/offers",
  },
  custom: {
    label: "Custom event",
    subject: "A note from VIDYORA",
    eyebrow: "With our compliments",
    headline: "Thinking of you this season",
    body: "Write your festival or event message here. Super Admin can personalise this for any occasion — store opening, anniversary, or a private salon.",
    ctaLabel: "Visit VIDYORA",
    ctaUrl: "/",
  },
};

export function defaultCampaignCopy(type: CampaignType): CampaignCopy {
  const appUrl = getEmailAppUrl();
  if (type === "WELCOME") {
    return {
      subject: "Welcome to VIDYORA",
      eyebrow: "You are one of us now",
      headline: "Jewellery, chosen with care",
      body: "Welcome to VIDYORA. You are now part of a house that believes jewellery should feel personal — not rushed, not noisy, just beautifully made.\n\nStart with a look you love, or browse collections crafted for everyday wear and ceremony alike.",
      ctaLabel: "Begin exploring",
      ctaUrl: `${appUrl}/products`,
      footnote: "Need help? Reply to this email or visit our Help page.",
    };
  }
  if (type === "DROPOUT") {
    return {
      subject: "Your jewellery is still waiting",
      eyebrow: "You left something behind",
      headline: "Shall we keep it aside for you?",
      body: "You were looking at pieces that do not stay in the bag for long. Your cart is saved — come back whenever you are ready, and we will pick up exactly where you left off.",
      ctaLabel: "Return to bag",
      ctaUrl: `${appUrl}/cart`,
      footnote: "If you have already checked out, please ignore this note.",
    };
  }
  if (type === "OFFER") {
    return {
      subject: "A private offer from VIDYORA",
      eyebrow: "Members' offer",
      headline: "A little extra sparkle, just for you",
      body: "This offer is reserved for VIDYORA customers. Use the code below on eligible jewellery before it expires — a gesture for those who already know the house.",
      ctaLabel: "Shop the offer",
      ctaUrl: `${appUrl}/offers`,
      couponCode: "VIDYORA10",
      footnote: "Terms apply. One use per customer unless stated otherwise.",
    };
  }
  return {
    ...FESTIVAL_PRESETS.diwali,
    ctaUrl: `${appUrl}${FESTIVAL_PRESETS.diwali.ctaUrl}`,
  };
}

export function renderCampaignEmail(options: {
  type: CampaignType;
  name: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  couponCode?: string;
  eyebrow?: string;
  footnote?: string;
  leftBehind?: string[];
}) {
  const firstName = options.name.trim().split(/\s+/)[0] || "there";
  const greeting = `<p style="margin:0 0 16px;">Dear ${escapeHtml(firstName)},</p>`;
  const items =
    options.leftBehind && options.leftBehind.length > 0
      ? `<tr><td style="padding:8px 36px 12px;">
            <div style="background:#faf8f6;border:1px solid #efe8e2;border-radius:14px;padding:16px 20px;font-family:Georgia,serif;color:#2b1a16;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#c4a574;">Still in your bag</p>
            ${options.leftBehind
              .map(
                (item) =>
                  `<p style="margin:0 0 4px;font-size:15px;">${escapeHtml(item)}</p>`,
              )
              .join("")}
            </div>
          </td></tr>`
      : "";

  const coupon = options.couponCode
    ? `<tr><td align="center" style="padding:0 36px 12px;">
        <div style="display:inline-block;border:1px dashed #c4a574;border-radius:12px;padding:12px 22px;font-family:Georgia,serif;letter-spacing:0.2em;color:#8b2e2e;font-size:18px;">
          ${escapeHtml(options.couponCode.toUpperCase())}
        </div>
      </td></tr>`
    : "";

  return wrapBrandEmail({
    preheader: options.headline,
    eyebrow: options.eyebrow,
    title: options.headline,
    bodyHtml: `${greeting}<p style="margin:0 0 12px;">${textToHtml(options.body)}</p>`,
    extraHtml: `${items}${coupon}`,
    cta: {
      label: options.ctaLabel,
      url: options.ctaUrl,
    },
    footnote: options.footnote,
  });
}

export type Contest = {
  id: string;
  title: string;
  status: "Open" | "Upcoming" | "Closed";
  window: string;
  prize: string;
  howToEnter: string[];
  rules: string[];
};

export const CONTESTS: Contest[] = [
  {
    id: "first-order-ladder",
    title: "First Order Rewards",
    status: "Open",
    window: "Ongoing for new customers (sign-in required)",
    prize:
      "Tiered first-order discounts: FIRST499 → ₹50 off (min ₹499) · FIRST999 → ₹100 off (min ₹999) · FIRST2K → ₹200 off (min ₹1,999). One code per account.",
    howToEnter: [
      "Create an account / sign in on vidyora.co.in (codes will not apply as guest).",
      "Add jewellery to cart for your first paid order and apply the matching code at checkout.",
      "Shop closer to ₹2,000 with FIRST2K for the biggest first-order saving.",
    ],
    rules: [
      "Valid only on the first non-cancelled order for your account.",
      "One use per customer. Codes do not combine.",
      "Cancelled / refused COD orders that still count as placed may block reuse — contact support if stuck.",
      "VIDYORA may pause codes when monthly usage limits are reached.",
    ],
  },
  {
    id: "festive-flat-off",
    title: "Festive Flat Off",
    status: "Open",
    window: "2 October 2026 – 5 January 2027 (Navratri → New Year)",
    prize:
      "Active festival codes rotate with the homepage banners: NAVRATRI75 → ₹75 off (min ₹799) · DUSSEHRA50 → ₹50 off (min ₹499) · DIWALI10 → 10% off max ₹100 (min ₹499) · XMAS75 → ₹75 off (min ₹799) · NEWYEAR10 → 10% off max ₹100 (min ₹499). Also FESTIVE10 — 10% off (max ₹100) on ₹499+. Sign-in required.",
    howToEnter: [
      "Sign in and shop during the festival window shown on the homepage banner.",
      "Apply the exact code printed on the banner (e.g. NAVRATRI75) at checkout.",
      "Cart must meet the minimum order printed with the code — codes are capped so margins stay safe.",
    ],
    rules: [
      "Cannot combine with first-order codes.",
      "One use per customer. Global usage caps apply.",
      "Percentage offers never exceed 10% / ₹100 max save; flat festival offs never exceed ₹75.",
      "Offer valid on VIDYORA catalogue products only.",
    ],
  },
  {
    id: "style-and-tag",
    title: "Style & Tag",
    status: "Open",
    window: "Ongoing — weekly winners every Monday",
    prize:
      "Weekly winners get a free VIDYORA piece (up to ₹499 MRP) or a ₹299 store credit on vidyora.co.in.",
    howToEnter: [
      "Place any paid order on VIDYORA (Razorpay or delivered COD).",
      "Share an unboxing or styling photo/reel on Instagram and tag @vidyora_official with #VidyoraStyle.",
      "Keep your order number handy. Winners are messaged on Instagram or the checkout email.",
    ],
    rules: [
      "Open to customers in India, 18 years and above.",
      "Cancelled, refused COD and returned orders do not qualify.",
      "One entry per paid order per week. VIDYORA team members are not eligible.",
      "Store credit is valid for 60 days on vidyora.co.in and cannot be exchanged for cash.",
    ],
  },
];

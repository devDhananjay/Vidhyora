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
    id: "festival-of-diamonds",
    title: "Festival of Diamonds",
    status: "Open",
    window: "1 September 2026 – 30 September 2026",
    prize:
      "Weekly draw: ₹25,000 VIDYORA voucher. Grand prize: a certified diamond pendant from the live catalogue.",
    howToEnter: [
      "Place a paid diamond jewellery order on VIDYORA during the contest window (Razorpay or delivered COD).",
      "Share your unboxing or styling photo on Instagram and tag @vidyora with #VidyoraDiamonds.",
      "Keep the order number. Winners are contacted on the email used at checkout.",
    ],
    rules: [
      "Open to customers in India, 18 years and above.",
      "Cancelled, refused COD and returned orders do not qualify.",
      "One entry per paid order. Employees of VIDYORA and seller boutiques are not eligible.",
      "Vouchers are valid for 90 days on vidyora.com and cannot be exchanged for cash.",
    ],
  },
  {
    id: "wedding-season-look",
    title: "Wedding Season Look",
    status: "Upcoming",
    window: "1 October 2026 – 15 November 2026",
    prize:
      "Three winners receive a complimentary jewellery styling session at a VIDYORA boutique, plus 15% off a wedding set (capped at ₹20,000).",
    howToEnter: [
      "Visit a boutique from the Store Locator or shop wedding jewellery online.",
      "Submit your bridal or guest look form (link goes live on 1 October).",
      "Finalists are styled in-store; the public vote runs on the VIDYORA blog.",
    ],
    rules: [
      "Looks must use VIDYORA jewellery, purchased or borrowed from a boutique trial.",
      "Discount applies on one wedding-jewellery order, cannot combine with FESTIVE20.",
      "Travel to the boutique is not reimbursed.",
    ],
  },
  {
    id: "boutique-lucky-draw",
    title: "Boutique lucky draw",
    status: "Open",
    window: "Ongoing at participating stores",
    prize: "Monthly draw: 22K gold coin or equivalent store credit.",
    howToEnter: [
      "Walk into a participating boutique and complete a try-on with an advisor.",
      "Drop your name and mobile in the lucky-draw bowl, or scan the in-store QR.",
      "Purchase not required. One entry per person per month.",
    ],
    rules: [
      "Participating cities are listed on the Store Locator page.",
      "Winner must collect the prize in person with a government ID.",
      "VIDYORA may photograph the handover for the blog, with consent.",
    ],
  },
];

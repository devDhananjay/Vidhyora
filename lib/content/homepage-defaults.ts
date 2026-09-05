import { ROUTES } from "@/lib/constants";
import { shopHref } from "@/lib/nav/mega-menu-data";
import type { HomepageConfigData } from "@/lib/validations/homepage";

export const DEFAULT_HOMEPAGE_CONFIG: HomepageConfigData = {
  version: 1,
  collections: {
    title: "VIDYORA Collections",
    subtitle: "Explore our newly launched collection",
    cards: [
      {
        id: "under-50k",
        title: "Under 50k",
        subtitle: "Everyday diamond edit",
        image:
          "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&q=80",
        href: shopHref({ maxPrice: "50000", collection: "Under 50K" }),
        span: "tall",
      },
      {
        id: "earrings",
        title: "Stunning in every Ear",
        image:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&q=80",
        href: shopHref({ item: "earrings", collection: "Earrings" }),
        span: "normal",
      },
      {
        id: "gold-daily",
        title: "Gold Coins & Daily Wear",
        image:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1000&q=80",
        href: shopHref({
          type: "gold",
          occasion: "daily",
          collection: "Gold Daily Wear",
        }),
        span: "normal",
      },
    ],
  },
  categories: {
    title: "Find Your Perfect Match",
    subtitle: "Shop by Categories",
    items: [
      {
        name: "Earrings",
        href: shopHref({ item: "earrings", collection: "Earrings" }),
        image:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      },
      {
        name: "Finger Rings",
        href: shopHref({ item: "rings", collection: "Finger Rings" }),
        image:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
      },
      {
        name: "Pendants",
        href: shopHref({ item: "pendants", collection: "Pendants" }),
        image:
          "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80",
      },
      {
        name: "Necklaces",
        href: shopHref({ item: "necklaces", collection: "Necklaces" }),
        image:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      },
      {
        name: "Bracelets",
        href: shopHref({ item: "bracelets", collection: "Bracelets" }),
        image:
          "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
      },
      {
        name: "Bangles",
        href: shopHref({ item: "bangles", collection: "Bangles" }),
        image:
          "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      },
      {
        name: "Chains",
        href: shopHref({ item: "chains", collection: "Chains" }),
        image:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      },
    ],
    viewAll: {
      countLabel: "10+",
      caption: "Categories to choose from",
      href: ROUTES.products,
    },
  },
  trending: {
    title: "Trending Now",
    subtitle: "Jewellery pieces everyone's eyeing right now",
    items: [
      {
        title: "Auspicious Occasion",
        href: shopHref({
          occasion: "festive",
          collection: "Auspicious Occasion",
        }),
        image:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&q=80",
      },
      {
        title: "Gifting Jewellery",
        href: shopHref({ occasion: "festive", collection: "Gifting" }),
        image:
          "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=900&q=80",
      },
      {
        title: "Everyday Diamonds",
        href: shopHref({
          type: "diamond",
          occasion: "daily",
          collection: "Everyday Diamonds",
        }),
        image:
          "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=900&q=80",
      },
    ],
  },
  world: {
    title: "VIDYORA World",
    subtitle: "A companion for every occasion",
    wedding: {
      title: "Wedding",
      subtitle: "Unforgettable jewels for the most memorable moment",
      image: "/images/bridal-rivaah.jpg",
      href: shopHref({
        occasion: "wedding",
        collection: "Wedding Jewellery",
      }),
    },
    diamond: {
      title: "Diamond",
      videoSrc: "/videos/vidyora-world-diamond.mp4?v=4",
      href: shopHref({ type: "diamond", collection: "Diamond" }),
    },
    gold: {
      title: "Gold",
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1000&q=80",
      href: shopHref({ type: "gold", collection: "Gold" }),
    },
  },
  featured: {
    title: "The Everyday Diamond Edit",
    subtitle: "Handpicked pieces for every celebration",
    viewAllHref: ROUTES.products,
  },
  assurance: {
    titlePrefix: "VIDYORA",
    titleAccent: "Assurance",
    subtitle: "Crafted by experts, cherished by you.",
    items: [
      { label: "Quality Craftsmanship" },
      { label: "Ethically Sourced" },
      { label: "100% Transparency" },
    ],
  },
  exchange: {
    title: "Exchange Program",
    subtitle: "Trusted by families across India.",
    items: [
      { label: "VIDYORA Exchange" },
      { label: "The Purity Guarantee" },
      { label: "Complete Transparency" },
      { label: "Lifetime Maintenance" },
    ],
  },
  hero: {
    slides: [
      {
        id: "under-30k",
        image: "/images/banners/under-30k.jpg?v=3",
        alt: "Everyday diamond jewellery under 30k",
        panelColor: "#628f8b",
        panelClassName: "left-[50%]",
        contentAlign: "right",
        eyebrow: "PRESENTS",
        titleMode: "script",
        titleLines: ["Under 30k"],
        subtitle: "The Everyday Diamond Edit",
        cta: "SHOP NOW",
        ctaHref: shopHref({ maxPrice: "30000", collection: "Under 30K" }),
        ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      },
      {
        id: "joy-of-dressing",
        image: "/images/banners/joy-of-dressing.jpg?v=3",
        alt: "Latest jewellery designs under 50k",
        panelColor: "#5c7a6a",
        panelClassName: "left-[48%]",
        contentAlign: "right",
        eyebrow: "PRESENTS",
        titleMode: "stacked",
        titleLines: ["The joy of", "dressing"],
        subtitle: "Explore latest designs under 50k",
        cta: "SHOP NOW",
        ctaHref: shopHref({ maxPrice: "50000", collection: "Under 50K" }),
        ctaClassName: "bg-[#e9d9cc] text-[#8b2e2e] hover:bg-[#f0e4da]",
      },
      {
        id: "festival-of-diamonds",
        image: "/images/banners/festival-of-diamonds.jpg?v=3",
        alt: "Festival of Diamonds campaign",
        panelColor: "transparent",
        panelClassName: "left-[46%]",
        contentAlign: "right-soft",
        titleMode: "serif",
        titleLines: ["Festival Of Diamonds"],
        subtitle:
          "Designs crafted for natural diamonds to sparkle the brightest",
        cta: "EXPLORE NOW",
        ctaHref: shopHref({
          type: "diamond",
          collection: "Festival of Diamonds",
        }),
        ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
      },
    ],
  },
  chooseYourLook: {
    title: "Choose Your Look",
    looks: [
      {
        id: "evening",
        title: "Evening Look",
        image:
          "https://images.unsplash.com/photo-1515626553181-0f218cb03f14?w=900&q=80",
        href: shopHref({ occasion: "party", collection: "Evening Look" }),
      },
      {
        id: "casual",
        title: "Casual Look",
        image:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900&q=80",
        href: shopHref({ occasion: "daily", collection: "Casual Look" }),
      },
      {
        id: "office",
        title: "Office Look",
        image:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&q=80",
        href: shopHref({ occasion: "office", collection: "Office Look" }),
      },
      {
        id: "modern",
        title: "Modern Look",
        image:
          "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=900&q=80",
        href: shopHref({ type: "diamond", collection: "Modern Look" }),
      },
      {
        id: "classic",
        title: "Classic Look",
        image:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&q=80",
        href: shopHref({ type: "gold", collection: "Classic Look" }),
      },
      {
        id: "party",
        title: "Party Look",
        image:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&q=80",
        href: shopHref({ occasion: "party", collection: "Party Look" }),
      },
    ],
  },
  styleStories: {
    eyebrow: "Styling",
    title: "Styling 101 With Diamonds",
    subtitle:
      "Tap a card to open the same layered story design, with video playing in the center.",
    stories: [
      {
        id: "everyday-diamonds",
        title: "Everyday Diamonds",
        subtitle: "Clean lines for daily wear",
        media: "/videos/styling-101-diamonds.mp4?v=1",
        poster:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80",
        href: shopHref({
          type: "diamond",
          occasion: "daily",
          collection: "Everyday Diamonds",
        }),
      },
      {
        id: "bridal-glow",
        title: "Bridal Glow",
        subtitle: "Statement pieces for wedding days",
        media: "/videos/styling-101-diamonds.mp4?v=1",
        poster:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
      },
      {
        id: "festive-gold",
        title: "Festive Gold",
        subtitle: "Warm tones for celebrations",
        media: "/videos/styling-101-diamonds.mp4?v=1",
        poster:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
        href: shopHref({
          type: "gold",
          occasion: "festive",
          collection: "Festive Gold",
        }),
      },
    ],
  },
  exploreTraditions: {
    title: "Explore the Traditions",
    items: [
      {
        id: "metro",
        title: "METRO BRIDE",
        subtitle: "A doorway to her world.",
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Metro Bride" }),
        moments: [
          {
            label: "Reception",
            image:
              "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=400&q=80",
          },
          {
            label: "Haldi",
            image:
              "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=400&q=80",
          },
          {
            label: "Mehendi",
            image:
              "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80",
          },
        ],
      },
      {
        id: "gujarati",
        title: "GUJARATI",
        subtitle: "A doorway to her world.",
        image:
          "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Gujarati Bride" }),
        moments: [
          {
            label: "Garba",
            image:
              "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&q=80",
          },
          {
            label: "Pithi",
            image:
              "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
          },
          {
            label: "Mandap",
            image:
              "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
          },
        ],
      },
      {
        id: "rajasthani",
        title: "RAJASTHANI",
        subtitle: "A doorway to her world.",
        image:
          "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Rajasthani Bride" }),
        moments: [
          {
            label: "Sehra",
            image:
              "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&q=80",
          },
          {
            label: "Poshak",
            image:
              "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&q=80",
          },
          {
            label: "Kundan",
            image:
              "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
          },
        ],
      },
      {
        id: "marathi",
        title: "MARATHI",
        subtitle: "A doorway to her world.",
        image:
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Marathi Bride" }),
        moments: [
          {
            label: "Nauvari",
            image:
              "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=400&q=80",
          },
          {
            label: "Mundavalya",
            image:
              "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&q=80",
          },
          {
            label: "Sankalp",
            image:
              "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80",
          },
        ],
      },
    ],
  },
  weddingMoodboard: {
    eyebrow: "Pinned, pressed & kept",
    title: "VIDYORA Wedding Moodboard",
    subtitle:
      "Every little clipping of a wedding being dreamt into being — mandap light, marigold gold, the lehenga she keeps coming back to.",
    ctaLabel: "Explore wedding jewellery",
    href: shopHref({ occasion: "wedding", collection: "Wedding Moodboard" }),
    polaroids: [
      {
        caption: "the whole mood.",
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",
        rotate: -6,
        top: "4%",
        left: "3%",
        w: 148,
        z: 5,
      },
      {
        caption: "soft, not loud.",
        image:
          "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=500&q=80",
        rotate: 5,
        top: "2%",
        left: "22%",
        w: 132,
        z: 4,
      },
      {
        caption: "keep this one.",
        image:
          "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=500&q=80",
        rotate: -3,
        top: "8%",
        left: "72%",
        w: 140,
        z: 6,
      },
      {
        caption: "just the two of us.",
        image:
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=80",
        rotate: 4,
        top: "28%",
        left: "82%",
        w: 128,
        z: 5,
      },
      {
        caption: "her forever set.",
        image:
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80",
        rotate: -5,
        top: "48%",
        left: "78%",
        w: 136,
        z: 7,
      },
      {
        caption: "quiet sparkle.",
        image:
          "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80",
        rotate: 3,
        top: "58%",
        left: "4%",
        w: 124,
        z: 6,
      },
      {
        caption: "for the pheras.",
        image:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&q=80",
        rotate: -4,
        top: "70%",
        left: "24%",
        w: 130,
        z: 5,
      },
      {
        caption: "a soft yes.",
        image:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&q=80",
        rotate: 6,
        top: "72%",
        left: "58%",
        w: 118,
        z: 8,
      },
    ],
    notes: [
      {
        label: "JEWELLERY",
        text: "Polki for the pheras, diamonds for the reception.",
        rotate: 2,
        top: "20%",
        left: "40%",
        w: 168,
        z: 9,
      },
      {
        label: "VENUE",
        text: "Check the courtyard lighting at 6pm.",
        rotate: -3,
        top: "34%",
        left: "8%",
        w: 150,
        z: 5,
      },
      {
        label: "MUST-DO",
        text: "Photo booth strip — one candid, one kiss.",
        rotate: 3,
        top: "38%",
        left: "52%",
        w: 158,
        z: 10,
      },
      {
        label: "NOTE TO SELF",
        text: "Marigolds & pampas — only if it stays soft.",
        rotate: -2,
        top: "54%",
        left: "36%",
        w: 170,
        z: 9,
      },
      {
        label: "COLOUR STORY",
        text: "Ivory, blush, a little antique gold.",
        rotate: 4,
        top: "78%",
        left: "8%",
        w: 156,
        z: 7,
      },
    ],
  },
};

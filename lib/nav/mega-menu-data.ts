import { ROUTES } from "@/lib/constants";

export type MegaLink = {
  label: string;
  href: string;
  image: string;
  swatch?: string;
};

export type MegaPanel = {
  kind: "links" | "photo-cards" | "metals";
  items: MegaLink[];
};

export type MegaMenuItem = {
  id: string;
  label: string;
  href: string;
  layout: "links" | "cards" | "gifts";
  sidebar: string[];
  links: MegaLink[];
  panels?: Record<string, MegaPanel>;
  banner: {
    title: string;
    subtitle: string;
    href: string;
    thumbs: string[];
  };
  promo: {
    image: string;
    title: string;
    cta: string;
    href: string;
  };
};

const IMG = {
  ring: "https://images.unsplash.com/photo-1605100804763-247f83b2bdcd?w=400&q=80",
  earrings: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=80",
  necklace: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
  pendant: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&q=80",
  bangles: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80",
  bracelet: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&q=80",
  pearl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
  hoop: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&q=80",
  bridal: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&q=80",
  gift: "https://images.unsplash.com/photo-1611652022419-a73ae642c8fc?w=400&q=80",
  ruby: "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=400&q=80",
  cocktail: "https://images.unsplash.com/photo-1603561591411-709570eaee86?w=400&q=80",
  model: "https://images.unsplash.com/photo-1515626553181-0f218cb03f14?w=800&q=80",
};

const shop = ROUTES.products;

export function shopHref(
  query: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `${shop}?${qs}` : shop;
}

function link(
  label: string,
  image: string,
  query: Record<string, string | undefined> = {},
  swatch?: string,
): MegaLink {
  return {
    label,
    image,
    href: shopHref({ ...query, collection: query.collection ?? label }),
    swatch,
  };
}

const PRICE_PANEL: MegaPanel = {
  kind: "photo-cards",
  items: [
    link("< 25K", IMG.earrings, { maxPrice: "25000", collection: "Under 25K" }),
    link("25K - 50K", IMG.ring, {
      minPrice: "25000",
      maxPrice: "50000",
      collection: "25K - 50K",
    }),
    link("50K - 1L", IMG.bangles, {
      minPrice: "50000",
      maxPrice: "100000",
      collection: "50K - 1L",
    }),
    link("1L & Above", IMG.necklace, {
      minPrice: "100000",
      collection: "1L & Above",
    }),
  ],
};

const OCCASION_PANEL: MegaPanel = {
  kind: "photo-cards",
  items: [
    link("Office Wear", IMG.model, { occasion: "office" }),
    link("Modern Wear", IMG.pendant, { occasion: "modern" }),
    link("Casual Wear", IMG.hoop, { occasion: "casual" }),
    link("Traditional Wear", IMG.bridal, { occasion: "traditional" }),
  ],
};

const METAL_PANEL: MegaPanel = {
  kind: "metals",
  items: [
    link("Rose", IMG.ruby, { metal: "Rose Gold", collection: "Rose Gold" }, "#e4b29a"),
    link("White", IMG.ring, { metal: "White Gold", collection: "White Gold" }, "#d8d5d0"),
    link("Yellow", IMG.necklace, { metal: "Gold", collection: "Yellow Gold" }, "#d4af37"),
  ],
};

const GENDER_PANEL: MegaPanel = {
  kind: "links",
  items: [
    link("Women", IMG.earrings, { gender: "women", collection: "Jewellery for Her" }),
    link("Men", IMG.model, { gender: "men", collection: "Jewellery for Him" }),
    link("Kids", IMG.hoop, { q: "kids", collection: "Kids Jewellery" }),
    link("Unisex", IMG.bracelet, { collection: "Unisex Jewellery" }),
  ],
};

const GOLD_COIN_PANEL: MegaPanel = {
  kind: "links",
  items: [
    link("Special Coins", IMG.gift, { item: "coins", type: "gold" }),
    link("1 Gram", IMG.gift, { item: "coins", type: "gold", collection: "1 Gram Gold Coin" }),
    link("2 Gram", IMG.gift, { item: "coins", type: "gold", collection: "2 Gram Gold Coin" }),
    link("4 Gram", IMG.gift, { item: "coins", type: "gold", collection: "4 Gram Gold Coin" }),
    link("8 Gram", IMG.gift, { item: "coins", type: "gold", collection: "8 Gram Gold Coin" }),
    link("10 Gram", IMG.gift, { item: "coins", type: "gold", collection: "10 Gram Gold Coin" }),
  ],
};

const MEN_PANEL: MegaPanel = {
  kind: "links",
  items: [
    link("Men's Bracelets", IMG.bracelet, { item: "bracelets", collection: "Men's Bracelets" }),
    link("Men's Chains", IMG.necklace, { item: "chains", collection: "Men's Chains" }),
    link("Men's Engagement Rings", IMG.ring, {
      item: "rings",
      occasion: "wedding",
      collection: "Men's Engagement Rings",
    }),
    link("Men's Kadas", IMG.bangles, { item: "kadas", collection: "Men's Kadas" }),
    link("Men's Pendants", IMG.pendant, { item: "pendants", collection: "Men's Pendants" }),
    link("Men's Rings", IMG.ruby, { item: "rings", collection: "Men's Rings" }),
  ],
};

const COMMON_PANELS: Record<string, MegaPanel> = {
  Price: PRICE_PANEL,
  Occasion: OCCASION_PANEL,
  Metal: METAL_PANEL,
  Gender: GENDER_PANEL,
};

export const MEGA_MENU: MegaMenuItem[] = [
  {
    id: "all",
    label: "All Jewellery",
    href: shopHref({ collection: "All Jewellery" }),
    layout: "links",
    sidebar: ["Category", "Price", "Occasion", "Gender"],
    links: [
      link("All Jewellery", IMG.necklace, { collection: "All Jewellery" }),
      link("Earrings", IMG.earrings, { item: "earrings" }),
      link("Pendants", IMG.pendant, { item: "pendants" }),
      link("Finger Rings", IMG.ring, { item: "rings" }),
      link("Mangalsutra", IMG.pearl, { item: "mangalsutra" }),
      link("Chains", IMG.necklace, { item: "chains" }),
      link("Nose Pin", IMG.hoop, { item: "nosepin" }),
      link("Necklaces", IMG.necklace, { item: "necklaces" }),
      link("Necklace Set", IMG.bridal, { item: "sets", collection: "Necklace Sets" }),
      link("Bangles", IMG.bangles, { item: "bangles" }),
      link("Bracelets", IMG.bracelet, { item: "bracelets" }),
      link("Pendants & Earring Set", IMG.pendant, {
        item: "sets",
        collection: "Pendants & Earring Sets",
      }),
    ],
    banner: {
      title: "Jewellery for Every Moment—See It All Here!",
      subtitle: "20+ designs to choose from",
      href: shopHref({ collection: "All Jewellery" }),
      thumbs: [IMG.earrings, IMG.ring],
    },
    promo: {
      image: IMG.necklace,
      title: "Discover timeless crafted gold jewellery.",
      cta: "Explore Now",
      href: shopHref({ type: "gold", collection: "Gold" }),
    },
    panels: COMMON_PANELS,
  },
  {
    id: "gold",
    label: "Gold",
    href: shopHref({ type: "gold", collection: "Gold" }),
    layout: "links",
    sidebar: ["Category", "Price", "Occasion", "Gold Coin", "Men", "Metal"],
    links: [
      link("All Gold", IMG.necklace, { type: "gold", collection: "Gold" }),
      link("Gold Bangles", IMG.bangles, { type: "gold", item: "bangles" }),
      link("Gold Bracelets", IMG.bracelet, { type: "gold", item: "bracelets" }),
      link("Gold Earrings", IMG.earrings, { type: "gold", item: "earrings" }),
      link("Gold Chains", IMG.necklace, { type: "gold", item: "chains" }),
      link("Gold Pendants", IMG.pendant, { type: "gold", item: "pendants" }),
      link("Gold Rings", IMG.ring, { type: "gold", item: "rings" }),
      link("Gold Engagement Rings", IMG.ruby, {
        type: "gold",
        item: "rings",
        occasion: "wedding",
      }),
      link("Gold Necklaces", IMG.necklace, { type: "gold", item: "necklaces" }),
      link("Gold Nose Pins", IMG.hoop, { type: "gold", item: "nosepin" }),
      link("Gold Kadas", IMG.bangles, { type: "gold", item: "kadas" }),
      link("Gold Mangalsutras", IMG.pearl, { type: "gold", item: "mangalsutra" }),
    ],
    banner: {
      title: "From Classic to Contemporary.",
      subtitle: "Explore stunning gold designs",
      href: shopHref({ type: "gold", collection: "Gold" }),
      thumbs: [IMG.bangles, IMG.necklace, IMG.ring],
    },
    promo: {
      image: IMG.model,
      title: "Handcrafted gold jewellery inspired by natural elegance",
      cta: "Explore Now",
      href: shopHref({ type: "gold", collection: "Gold" }),
    },
    panels: {
      ...COMMON_PANELS,
      "Gold Coin": GOLD_COIN_PANEL,
      Men: MEN_PANEL,
    },
  },
  {
    id: "diamond",
    label: "Diamond",
    href: shopHref({ type: "diamond", collection: "Diamond" }),
    layout: "links",
    sidebar: ["Category", "Price", "Occasion", "Gender"],
    links: [
      link("All Diamond", IMG.ring, { type: "diamond", collection: "Diamond" }),
      link("Diamond Bangles", IMG.bangles, { type: "diamond", item: "bangles" }),
      link("Diamond Bracelets", IMG.bracelet, { type: "diamond", item: "bracelets" }),
      link("Diamond Earrings", IMG.earrings, { type: "diamond", item: "earrings" }),
      link("Diamond Rings", IMG.ring, { type: "diamond", item: "rings" }),
      link("Diamond Mangalsutra", IMG.pearl, { type: "diamond", item: "mangalsutra" }),
      link("Diamond Necklace Set", IMG.necklace, {
        type: "diamond",
        item: "sets",
        collection: "Diamond Necklace Sets",
      }),
      link("Diamond Necklaces", IMG.necklace, { type: "diamond", item: "necklaces" }),
      link("Diamond Nose Pins", IMG.hoop, { type: "diamond", item: "nosepin" }),
      link("Diamond Pendants", IMG.pendant, { type: "diamond", item: "pendants" }),
    ],
    banner: {
      title: "Diamonds for Every Sparkle",
      subtitle: "Discover exquisite diamond designs",
      href: shopHref({ type: "diamond", collection: "Diamond" }),
      thumbs: [IMG.earrings, IMG.pendant],
    },
    promo: {
      image: IMG.ring,
      title: "Natural Diamonds",
      cta: "Explore Now",
      href: shopHref({ type: "diamond", collection: "Diamond" }),
    },
    panels: COMMON_PANELS,
  },
  {
    id: "earrings",
    label: "Earrings",
    href: shopHref({ item: "earrings", collection: "Earrings" }),
    layout: "links",
    sidebar: ["Category", "Price", "Occasion", "Gender", "Metal & Stones"],
    links: [
      link("All Earrings", IMG.earrings, { item: "earrings", collection: "Earrings" }),
      link("Drop & Danglers", IMG.earrings, { item: "drops" }),
      link("Hoop & Huggies", IMG.hoop, { item: "hoops" }),
      link("Jhumkas", IMG.bridal, { item: "jhumkas" }),
      link("Studs & Tops", IMG.hoop, { item: "studs" }),
    ],
    banner: {
      title: "Earrings for You — Crafted with Precision, Designed for Elegance.",
      subtitle: "Explore stunning styles",
      href: shopHref({ item: "earrings", collection: "Earrings" }),
      thumbs: [IMG.earrings, IMG.hoop],
    },
    promo: {
      image: IMG.earrings,
      title: "Singular brilliance, infinite charm",
      cta: "Shop now",
      href: shopHref({ item: "earrings", collection: "Earrings" }),
    },
    panels: COMMON_PANELS,
  },
  {
    id: "daily",
    label: "Daily Wear",
    href: shopHref({ occasion: "daily", collection: "Daily Wear" }),
    layout: "links",
    sidebar: ["Category", "Price", "Style", "Gender"],
    links: [
      link("Dailywear Jewellery", IMG.hoop, { occasion: "daily", collection: "Daily Wear" }),
      link("Dailywear Rings", IMG.ring, { occasion: "daily", item: "rings" }),
      link("Dailywear Chains", IMG.necklace, { occasion: "daily", item: "chains" }),
      link("Dailywear Earrings", IMG.earrings, { occasion: "daily", item: "earrings" }),
      link("Dailywear Pendants", IMG.pendant, { occasion: "daily", item: "pendants" }),
      link("Dailywear Bracelets", IMG.bracelet, { occasion: "daily", item: "bracelets" }),
    ],
    banner: {
      title: "From Everyday Glow to Extraordinary Sparkle.",
      subtitle: "Designs for every day",
      href: shopHref({ occasion: "daily", collection: "Daily Wear" }),
      thumbs: [IMG.hoop],
    },
    promo: {
      image: IMG.pendant,
      title: "Effortless style to make everyday sparkle",
      cta: "Shop now",
      href: shopHref({ occasion: "daily", collection: "Daily Wear" }),
    },
    panels: {
      Price: PRICE_PANEL,
      Style: OCCASION_PANEL,
      Gender: GENDER_PANEL,
    },
  },
  {
    id: "gemstone",
    label: "Gemstone",
    href: shopHref({ item: "gemstone", collection: "Gemstone" }),
    layout: "links",
    sidebar: ["Category"],
    links: [
      link("Gemstone", IMG.cocktail, { item: "gemstone", collection: "Gemstone" }),
      link("Gemstone Earrings", IMG.earrings, {
        item: "earrings",
        stone: "gemstone",
        collection: "Gemstone Earrings",
      }),
      link("Gemstone Pendants", IMG.pendant, {
        item: "pendants",
        stone: "gemstone",
        collection: "Gemstone Pendants",
      }),
      link("Gemstone Rings", IMG.ruby, {
        item: "rings",
        stone: "gemstone",
        collection: "Gemstone Rings",
      }),
      link("Emerald Stone", IMG.pendant, { item: "emerald" }),
      link("Ruby", IMG.ruby, { item: "ruby" }),
    ],
    banner: {
      title: "Colour, character, craft.",
      subtitle: "Natural gemstones for every mood",
      href: shopHref({ item: "gemstone", collection: "Gemstone" }),
      thumbs: [IMG.ruby, IMG.cocktail],
    },
    promo: {
      image: IMG.pendant,
      title: "Natural gemstones, vibrant colours",
      cta: "Explore now",
      href: shopHref({ item: "gemstone", collection: "Gemstone" }),
    },
  },
  {
    id: "wedding",
    label: "Wedding",
    href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
    layout: "cards",
    sidebar: ["Category", "Community", "Metal"],
    links: [
      link("All Bridal", IMG.bridal, { occasion: "wedding", collection: "Wedding Jewellery" }),
      link("Wedding Choker", IMG.necklace, { occasion: "wedding", item: "choker" }),
      link("Wedding Haram", IMG.pearl, { occasion: "wedding", item: "necklaces", collection: "Wedding Haram" }),
      link("Wedding Bangles", IMG.bangles, { occasion: "wedding", item: "bangles" }),
      link("Wedding Diamond", IMG.ring, { occasion: "wedding", type: "diamond", collection: "Wedding Diamond" }),
      link("Wedding Mangalsutra", IMG.pearl, { occasion: "wedding", item: "mangalsutra" }),
      link("Accessories", IMG.gift, { item: "tikka", collection: "Wedding Accessories" }),
    ],
    banner: {
      title: "Unforgettable jewels for the most memorable moment",
      subtitle: "Bridal collections",
      href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
      thumbs: [IMG.bridal],
    },
    promo: {
      image: "/images/bridal-rivaah.jpg",
      title: "Wedding jewellery, crafted for forever",
      cta: "Explore Now",
      href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
    },
    panels: {
      Metal: METAL_PANEL,
    },
  },
  {
    id: "gifting",
    label: "Gifting",
    href: shopHref({ occasion: "festive", collection: "Gifting" }),
    layout: "gifts",
    sidebar: ["Gifts for", "Gift Card", "Price", "Occasion", "Corporate Gifting"],
    links: [
      link("Her", IMG.earrings, { gender: "women", collection: "Gifts for Her" }),
      link("Him", IMG.model, { item: "bracelets", collection: "Gifts for Him" }),
      link("Kids", IMG.hoop, { q: "kids", collection: "Gifts for Kids" }),
    ],
    banner: {
      title: "Celebrate life's joys with VIDYORA.",
      subtitle: "Find jewellery for all occasions and celebrations here.",
      href: shopHref({ occasion: "festive", collection: "Gifting" }),
      thumbs: [IMG.ring, IMG.earrings, IMG.pendant],
    },
    promo: {
      image: IMG.gift,
      title: "Gift card",
      cta: "Explore Now",
      href: shopHref({ occasion: "festive", collection: "Gifting" }),
    },
    panels: {
      Price: PRICE_PANEL,
      Occasion: OCCASION_PANEL,
    },
  },
  {
    id: "under50k",
    label: "Under 50K",
    href: shopHref({ maxPrice: "50000", collection: "Under 50K" }),
    layout: "links",
    sidebar: ["Category", "Price"],
    links: [
      link("Earrings Under 50K", IMG.earrings, {
        item: "earrings",
        maxPrice: "50000",
      }),
      link("Rings Under 50K", IMG.ring, { item: "rings", maxPrice: "50000" }),
      link("Pendants Under 50K", IMG.pendant, {
        item: "pendants",
        maxPrice: "50000",
      }),
      link("Daily Wear Under 50K", IMG.hoop, {
        occasion: "daily",
        maxPrice: "50000",
      }),
    ],
    banner: {
      title: "The Everyday Diamond Edit",
      subtitle: "Beautiful designs under ₹50,000",
      href: shopHref({ maxPrice: "50000", collection: "Under 50K" }),
      thumbs: [IMG.pendant, IMG.earrings],
    },
    promo: {
      image: IMG.pendant,
      title: "Under 50k dailywear jewellery",
      cta: "Shop now",
      href: shopHref({ maxPrice: "50000", occasion: "daily", collection: "Daily Wear Under 50K" }),
    },
    panels: {
      Price: PRICE_PANEL,
    },
  },
];

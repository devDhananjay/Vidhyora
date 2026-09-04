export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMinutes: number;
  image: string;
  shopLabel?: string;
  shopHref?: string;
  paragraphs: string[];
  tips?: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-choose-a-solitaire-ring",
    title: "How to choose a diamond solitaire that feels personal",
    excerpt:
      "Cut, setting and finger size matter more than carat size. A calm guide before you buy your first solitaire.",
    category: "Diamonds",
    date: "12 August 2026",
    readMinutes: 6,
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1400&q=80",
    shopLabel: "Shop diamond rings",
    shopHref: "/products?type=diamond&collection=Diamond",
    paragraphs: [
      "A solitaire is the quietest kind of jewellery statement. One stone, one setting, and a lifetime of wear. That is why the choice feels heavy: you are not buying a trend, you are picking a shape that will sit on the hand every day.",
      "Start with cut, not carat. A well-cut diamond returns light even at a modest size. Round brilliant remains the most forgiving on most hands. Oval and pear elongate the finger. Princess and cushion feel vintage without looking costume. On VIDYORA, every diamond listing is seller-approved and should mention certification on the product page.",
      "Setting changes how the stone lives. A six-claw prong lifts the diamond and catches light. A bezel wrap is kinder for daily wear and less likely to snag a saree pallu. If you work with your hands, ask for a lower profile. If the ring is for a proposal, try sizes in a boutique first, then order the certified piece online.",
      "Budget is easier when you split it: metal, stone, and making. 18K gold warms the diamond; platinum stays white and holds prongs longer. Compare the listed price with the compare-at price on the card, then check return eligibility before you pay.",
    ],
    tips: [
      "Measure finger size in the evening; fingers swell through the day.",
      "Ask for the certificate number on the product page or from the seller.",
      "Daily-wear solitaires do better in a bezel or low claw setting.",
    ],
  },
  {
    slug: "gold-for-work-and-wedding",
    title: "Gold jewellery: what to wear to work, and what to save for the wedding",
    excerpt:
      "Daily gold should be light, hallmarked and easy to layer. Bridal gold can be heavier — if the set still lets you move.",
    category: "Gold",
    date: "28 July 2026",
    readMinutes: 5,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1400&q=80",
    shopLabel: "Shop gold jewellery",
    shopHref: "/products?type=gold&collection=Gold",
    paragraphs: [
      "Indian gold is not one wardrobe. The chain you wear with a cotton kurta is not the necklace that has to hold against a kanjeevaram. Treating them as the same purchase is how pieces stay in the locker.",
      "For work and travel, look at 18K or lightweight 22K with a secure clasp. Chains, small hoops, and a slim bangle stack survive commutes. Check the product weight on VIDYORA before you add to cart — a 4 gram daily chain feels different from a 20 gram bridal choker.",
      "Wedding jewellery can be denser, but it still has to be worn for hours. A necklace should sit without pulling. Bangles should pass the wrist without scraping. If you are buying a set, try the earrings first; they tell you if the whole look is too heavy.",
      "Hallmarking is non-negotiable. VIDYORA seller admins list purity on the product. Keep the invoice and certificate with the box. You will need both if you ever exchange or return the piece.",
    ],
    tips: [
      "Daily gold: lighter weight, secure clasps, low-profile settings.",
      "Bridal gold: try earrings and necklace together, not separately.",
      "Always keep the hallmark invoice with the jewellery box.",
    ],
  },
  {
    slug: "gifting-jewellery-without-guessing-size",
    title: "Gifting jewellery without guessing the size",
    excerpt:
      "Pendants, earrings and adjustable bracelets forgive a surprise. Rings do not. Here is what to send when you cannot ask.",
    category: "Gifting",
    date: "9 July 2026",
    readMinutes: 4,
    image:
      "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1400&q=80",
    shopLabel: "Shop gifting",
    shopHref: "/products?occasion=festive&collection=Gifting",
    paragraphs: [
      "Jewellery is an intimate gift. That is the charm and the risk. A ring in the wrong size sits in a drawer. A pendant in the right metal gets worn the same evening.",
      "If you cannot ask the size, skip rings. Choose earrings (studs and hoops rarely fail), a pendant on a chain with a few extra links, or an adjustable bracelet. Gold coins and small chains also travel well if the recipient already has a favourite chain at home.",
      "Match metal to what they already wear. If their everyday pieces are yellow gold, do not surprise them with rose gold unless they have asked. For men, a plain chain or kara is safer than a fashion bracelet.",
      "VIDYORA ships insured across India. Add a note at checkout if you want the invoice without a price, and keep the return window in mind — unused, tagged jewellery can come back if the gift misses.",
    ],
    tips: [
      "Safest gifts: earrings, pendants, coins, adjustable bracelets.",
      "Match the metal they already wear.",
      "Keep tags on until they try the piece.",
    ],
  },
  {
    slug: "caring-for-gemstone-jewellery",
    title: "How to care for gemstone jewellery between wears",
    excerpt:
      "Emeralds, pearls and polki do not like the same cleaning as diamonds. A short care ritual that keeps colour and setting intact.",
    category: "Care",
    date: "21 June 2026",
    readMinutes: 5,
    image:
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=1400&q=80",
    shopLabel: "Shop gemstones",
    shopHref: "/products?item=gemstone&collection=Gemstone",
    paragraphs: [
      "Gemstones are not interchangeable. A diamond can take a soft brush. An emerald is often oiled and can cloud if you soak it. Pearls hate perfume. Polki foil backs hate water. Treat the stone, not the metal.",
      "After a function, wipe gold and diamonds with a dry, lint-free cloth. For everyday gold, a drop of mild soap in lukewarm water is enough — never toothpaste, never baking soda. Dry fully before the box, or you trap moisture in the clasp.",
      "Store each piece separately. Chains tangle, prongs scratch pearls, and a heavy necklace will bend a thin earring post overnight. Silica sachets in the locker help in monsoon cities.",
      "If a stone feels loose, stop wearing it and write to support or visit a boutique from the Store Locator. VIDYORA sellers can advise on tightening; do not DIY with glue.",
    ],
    tips: [
      "Perfume and hairspray before jewellery, never after.",
      "No ultrasonic cleaners on pearls, emerald or polki.",
      "Get claws checked once a year on frequently worn rings.",
    ],
  },
  {
    slug: "reading-a-jewellery-certificate",
    title: "What a jewellery certificate is actually telling you",
    excerpt:
      "Hallmark, diamond report and invoice are three different documents. Here is how to read them before you pay.",
    category: "Guides",
    date: "4 June 2026",
    readMinutes: 5,
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1400&q=80",
    shopLabel: "Shop with confidence",
    shopHref: "/products",
    paragraphs: [
      "A pretty product photo is not a guarantee. The paperwork is. On VIDYORA, approved listings should make purity, weight and certification visible before checkout. If a field is missing, message support or skip the piece.",
      "Hallmarking on gold tells you purity (14K, 18K, 22K) and that the article was assayed. It does not tell you the making charge or the design value. That lives on the invoice: metal rate, wastage, GST, stone value if any.",
      "A diamond certificate (IGI, GIA or equivalent) describes the stone: carat, colour, clarity, cut. Match the certificate number to the listing. A report for a different stone is not a report.",
      "Keep digital copies. Returns, insurance and future exchange all ask for the original invoice plus certificate. COD orders still generate the same documents once delivered and paid.",
    ],
    tips: [
      "Match certificate numbers to the product, not the brand name on the box.",
      "Invoice should split metal, making and GST.",
      "Store scans of certificates with your order confirmation email.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

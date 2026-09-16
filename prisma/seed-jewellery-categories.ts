/**
 * Upsert storefront jewellery categories into Category Management
 * so sellers see them when adding products.
 *
 *   npx tsx prisma/seed-jewellery-categories.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CategorySeed = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  commissionPercentage: number;
  image?: string;
};

const CATEGORIES: CategorySeed[] = [
  {
    name: "Earrings",
    slug: "earrings",
    description:
      "Explore elegant earrings for every occasion, from everyday studs and hoops to statement and traditional designs.",
    sortOrder: 1,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  },
  {
    name: "Finger Rings",
    slug: "rings",
    description:
      "From delicate everyday bands to bold statement rings crafted in gold and diamond.",
    sortOrder: 2,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
  },
  {
    name: "Pendants",
    slug: "pendants",
    description:
      "Solitaires, religious motifs and everyday pendants that pair beautifully with chains.",
    sortOrder: 3,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80",
  },
  {
    name: "Necklaces",
    slug: "necklaces",
    description:
      "Layered, choker and traditional necklaces for weddings, gifting and daily wear.",
    sortOrder: 4,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    description:
      "Tennis, charm and cuff bracelets in gold, diamond and contemporary metals.",
    sortOrder: 5,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
  },
  {
    name: "Bangles",
    slug: "bangles",
    description:
      "Classic and contemporary gold bangles for festive, bridal and everyday looks.",
    sortOrder: 6,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  },
  {
    name: "Chains",
    slug: "chains",
    description:
      "Lightweight and statement chains in yellow, rose and white gold finishes.",
    sortOrder: 7,
    commissionPercentage: 10,
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  },
  {
    name: "Mangalsutra",
    slug: "mangalsutra",
    description:
      "Traditional and modern mangalsutra designs for everyday wear and ceremonies.",
    sortOrder: 8,
    commissionPercentage: 10,
  },
  {
    name: "Nose Pins",
    slug: "nosepin",
    description:
      "Delicate nose pins and studs in gold and diamond for everyday elegance.",
    sortOrder: 9,
    commissionPercentage: 10,
  },
  {
    name: "Jewellery Sets",
    slug: "sets",
    description:
      "Coordinated necklace, earring and pendant sets for weddings and celebrations.",
    sortOrder: 10,
    commissionPercentage: 10,
  },
  {
    name: "Kadas",
    slug: "kadas",
    description:
      "Bold gold and diamond kadas for men and women, from classic to contemporary.",
    sortOrder: 11,
    commissionPercentage: 10,
  },
  {
    name: "Stud Earrings",
    slug: "studs",
    description:
      "Everyday studs and tops in gold, diamond and gemstones.",
    sortOrder: 12,
    commissionPercentage: 10,
  },
  {
    name: "Hoop Earrings",
    slug: "hoops",
    description:
      "Hoops and huggies in multiple sizes for casual and party wear.",
    sortOrder: 13,
    commissionPercentage: 10,
  },
  {
    name: "Drop Earrings",
    slug: "drops",
    description:
      "Drop and dangler earrings that add movement and sparkle to every look.",
    sortOrder: 14,
    commissionPercentage: 10,
  },
  {
    name: "Jhumkas",
    slug: "jhumkas",
    description:
      "Traditional and fusion jhumkas for festive and bridal occasions.",
    sortOrder: 15,
    commissionPercentage: 10,
  },
  {
    name: "Chokers",
    slug: "choker",
    description:
      "Close-fitting chokers and bridal neckpieces for statement styling.",
    sortOrder: 16,
    commissionPercentage: 10,
  },
  {
    name: "Anklets",
    slug: "anklets",
    description:
      "Delicate and ornate anklets for festive and everyday wear.",
    sortOrder: 17,
    commissionPercentage: 10,
  },
  {
    name: "Gold Coins",
    slug: "coins",
    description:
      "Investment and gifting gold coins in popular weights and finishes.",
    sortOrder: 18,
    commissionPercentage: 8,
  },
  {
    name: "Gold",
    slug: "gold",
    description: "22K and 18K gold jewellery across all styles.",
    sortOrder: 19,
    commissionPercentage: 8,
  },
  {
    name: "Diamond",
    slug: "diamond",
    description: "Diamond jewellery and solitaires for every occasion.",
    sortOrder: 20,
    commissionPercentage: 12,
  },
  {
    name: "Gemstone",
    slug: "gemstone",
    description:
      "Coloured gemstone jewellery including emerald, ruby, sapphire and more.",
    sortOrder: 21,
    commissionPercentage: 10,
  },
  {
    name: "Emerald",
    slug: "emerald",
    description: "Emerald rings, pendants and earrings in gold settings.",
    sortOrder: 22,
    commissionPercentage: 10,
  },
  {
    name: "Ruby",
    slug: "ruby",
    description: "Ruby jewellery for festive colour and classic elegance.",
    sortOrder: 23,
    commissionPercentage: 10,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description:
      "Tikkas, hair accessories and complementary jewellery pieces.",
    sortOrder: 24,
    commissionPercentage: 10,
  },
];

async function main() {
  console.log(`Upserting ${CATEGORIES.length} jewellery categories…`);

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        isActive: true,
        sortOrder: cat.sortOrder,
        commissionPercentage: cat.commissionPercentage,
        ...(cat.image ? { image: cat.image } : {}),
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        isActive: true,
        sortOrder: cat.sortOrder,
        commissionPercentage: cat.commissionPercentage,
      },
    });
    console.log(`  ✓ ${cat.name} (/${cat.slug})`);
  }

  const active = await prisma.category.count({ where: { isActive: true } });
  console.log(`\nDone. Active categories: ${active}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

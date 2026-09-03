import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const jewelryProducts = [
  {
    name: "Diamond Solitaire Ring",
    slug: "diamond-solitaire-ring",
    description:
      "Stunning 18K white gold solitaire ring featuring a brilliant-cut diamond. Perfect for engagements and special occasions.",
    shortDescription: "18K white gold diamond solitaire ring",
    brand: "Luxe Jewels",
    basePrice: 125000,
    compareAtPrice: 150000,
    attributes: {
      metal: "18K White Gold",
      stone: "Diamond",
      weight: "3.5g",
      purity: "18K",
    },
  },
  {
    name: "Gold Chain Necklace",
    slug: "gold-chain-necklace",
    description:
      "Classic 22K yellow gold chain necklace with intricate rope design. Timeless elegance for everyday wear.",
    shortDescription: "22K yellow gold chain necklace",
    brand: "Golden Era",
    basePrice: 85000,
    compareAtPrice: 95000,
    attributes: { metal: "22K Gold", weight: "15g", length: "18 inches" },
  },
  {
    name: "Emerald Drop Earrings",
    slug: "emerald-drop-earrings",
    description:
      "Elegant drop earrings featuring natural emeralds set in sterling silver with gold plating. Perfect for formal occasions.",
    shortDescription: "Emerald sterling silver earrings",
    brand: "Gem Palace",
    basePrice: 45000,
    compareAtPrice: 55000,
    attributes: {
      metal: "Sterling Silver",
      stone: "Emerald",
      weight: "4g",
    },
  },
  {
    name: "Pearl String Necklace",
    slug: "pearl-string-necklace",
    description:
      "Classic freshwater pearl necklace with AAA grade pearls. Comes with elegant clasp and presentation box.",
    shortDescription: "Freshwater pearl necklace",
    brand: "Pearl Heritage",
    basePrice: 35000,
    compareAtPrice: 42000,
    attributes: {
      stone: "Freshwater Pearl",
      grade: "AAA",
      length: "16 inches",
    },
  },
  {
    name: "Ruby Engagement Ring",
    slug: "ruby-engagement-ring",
    description:
      "Exquisite 18K rose gold engagement ring with natural ruby center stone surrounded by diamonds.",
    shortDescription: "18K rose gold ruby ring",
    brand: "Luxe Jewels",
    basePrice: 175000,
    compareAtPrice: 200000,
    attributes: {
      metal: "18K Rose Gold",
      stone: "Ruby & Diamond",
      weight: "4.2g",
    },
  },
  {
    name: "Gold Bangles Set",
    slug: "gold-bangles-set",
    description:
      "Set of 4 traditional 22K gold bangles with engraved patterns. Perfect for weddings and festive occasions.",
    shortDescription: "22K gold bangles set of 4",
    brand: "Golden Era",
    basePrice: 120000,
    compareAtPrice: 135000,
    attributes: { metal: "22K Gold", weight: "40g", quantity: "4 pieces" },
  },
  {
    name: "Silver Oxidized Jhumka",
    slug: "silver-oxidized-jhumka",
    description:
      "Traditional oxidized silver jhumka earrings with intricate tribal designs. Lightweight and comfortable.",
    shortDescription: "Oxidized silver jhumka earrings",
    brand: "Tribal Arts",
    basePrice: 3500,
    compareAtPrice: 5000,
    attributes: { metal: "Sterling Silver", finish: "Oxidized", weight: "8g" },
  },
  {
    name: "Diamond Tennis Bracelet",
    slug: "diamond-tennis-bracelet",
    description:
      "Stunning 18K white gold tennis bracelet featuring 50 brilliant-cut diamonds. Elegant and timeless design.",
    shortDescription: "Diamond tennis bracelet",
    brand: "Luxe Jewels",
    basePrice: 250000,
    compareAtPrice: 280000,
    attributes: {
      metal: "18K White Gold",
      stone: "50 Diamonds",
      weight: "12g",
    },
  },
  {
    name: "Sapphire Pendant Necklace",
    slug: "sapphire-pendant-necklace",
    description:
      "Beautiful blue sapphire pendant set in 18K white gold with delicate chain. Perfect gift for loved ones.",
    shortDescription: "Blue sapphire pendant necklace",
    brand: "Gem Palace",
    basePrice: 65000,
    compareAtPrice: 75000,
    attributes: {
      metal: "18K White Gold",
      stone: "Blue Sapphire",
      weight: "3.8g",
    },
  },
  {
    name: "Gold Hoop Earrings",
    slug: "gold-hoop-earrings",
    description:
      "Classic 22K yellow gold hoop earrings with sleek finish. Versatile design suitable for all occasions.",
    shortDescription: "22K gold hoop earrings",
    brand: "Golden Era",
    basePrice: 28000,
    compareAtPrice: 32000,
    attributes: { metal: "22K Gold", weight: "6g", diameter: "25mm" },
  },
  {
    name: "Kundan Maang Tikka",
    slug: "kundan-maang-tikka",
    description:
      "Traditional Kundan maang tikka with semi-precious stones. Perfect for bridal wear and special occasions.",
    shortDescription: "Kundan maang tikka",
    brand: "Royal Jewels",
    basePrice: 15000,
    compareAtPrice: 18000,
    attributes: { metal: "Gold Plated", stone: "Kundan", weight: "15g" },
  },
  {
    name: "Platinum Wedding Band",
    slug: "platinum-wedding-band",
    description:
      "Simple and elegant platinum wedding band with brushed finish. Durable and hypoallergenic.",
    shortDescription: "Platinum wedding band",
    brand: "Eternal Rings",
    basePrice: 55000,
    compareAtPrice: 62000,
    attributes: { metal: "Platinum", purity: "95%", weight: "8g" },
  },
  {
    name: "Coral Beaded Necklace",
    slug: "coral-beaded-necklace",
    description:
      "Natural coral beaded necklace with gold clasp. Vibrant color and traditional design.",
    shortDescription: "Coral beaded necklace",
    brand: "Ocean Gems",
    basePrice: 22000,
    compareAtPrice: 26000,
    attributes: { stone: "Natural Coral", length: "20 inches", weight: "25g" },
  },
  {
    name: "Rose Gold Charm Bracelet",
    slug: "rose-gold-charm-bracelet",
    description:
      "Delicate 18K rose gold charm bracelet with interchangeable charms. Modern and stylish design.",
    shortDescription: "18K rose gold charm bracelet",
    brand: "Modern Luxe",
    basePrice: 42000,
    compareAtPrice: 48000,
    attributes: {
      metal: "18K Rose Gold",
      weight: "7g",
      charms: "5 included",
    },
  },
  {
    name: "Amethyst Ring Set",
    slug: "amethyst-ring-set",
    description:
      "Set of 3 sterling silver rings featuring natural amethyst stones in various cuts. Perfect for stacking.",
    shortDescription: "Amethyst silver ring set",
    brand: "Gem Palace",
    basePrice: 18000,
    compareAtPrice: 22000,
    attributes: {
      metal: "Sterling Silver",
      stone: "Amethyst",
      quantity: "3 rings",
    },
  },
  {
    name: "Antique Gold Choker",
    slug: "antique-gold-choker",
    description:
      "Traditional antique finish 22K gold choker with temple jewelry design. Perfect for weddings.",
    shortDescription: "Antique gold temple choker",
    brand: "Heritage Jewels",
    basePrice: 185000,
    compareAtPrice: 210000,
    attributes: { metal: "22K Gold", weight: "55g", style: "Temple Jewelry" },
  },
  {
    name: "Turquoise Pendant Set",
    slug: "turquoise-pendant-set",
    description:
      "Vibrant turquoise pendant with matching earrings in oxidized silver. Bohemian style jewelry set.",
    shortDescription: "Turquoise pendant and earring set",
    brand: "Boho Gems",
    basePrice: 8500,
    compareAtPrice: 11000,
    attributes: {
      metal: "Sterling Silver",
      stone: "Turquoise",
      includes: "Pendant & Earrings",
    },
  },
  {
    name: "Diamond Stud Earrings",
    slug: "diamond-stud-earrings",
    description:
      "Classic 18K white gold diamond stud earrings with screw backs. Perfect for everyday elegance.",
    shortDescription: "Diamond stud earrings 0.5ct",
    brand: "Luxe Jewels",
    basePrice: 95000,
    compareAtPrice: 110000,
    attributes: {
      metal: "18K White Gold",
      stone: "Diamond 0.5ct",
      weight: "2g",
    },
  },
  {
    name: "Gold Anklet Pair",
    slug: "gold-anklet-pair",
    description:
      "Delicate 22K gold anklet pair with ghungroo bells. Traditional design with modern comfort.",
    shortDescription: "22K gold anklet pair",
    brand: "Golden Era",
    basePrice: 38000,
    compareAtPrice: 43000,
    attributes: {
      metal: "22K Gold",
      weight: "12g",
      quantity: "2 pieces",
    },
  },
  {
    name: "Cubic Zirconia Cocktail Ring",
    slug: "cubic-zirconia-cocktail-ring",
    description:
      "Bold cocktail ring featuring large cubic zirconia stone in sterling silver with rhodium plating.",
    shortDescription: "CZ cocktail ring",
    brand: "Fashion Jewels",
    basePrice: 5500,
    compareAtPrice: 7500,
    attributes: {
      metal: "Sterling Silver",
      stone: "Cubic Zirconia",
      weight: "6g",
    },
  },
];

async function main() {
  console.log("🌱 Starting jewelry products seed...");

  // Create or get admin user (seller)
  let seller = await prisma.user.findFirst({
    where: { role: "SELLER" },
    include: { sellerProfile: true },
  });

  if (!seller || !seller.sellerProfile) {
    console.log("Creating seller user...");
    seller = await prisma.user.create({
      data: {
        name: "Jewelry Store Admin",
        email: "jewelry@vidyora.com",
        role: "SELLER",
        emailVerified: new Date(),
        sellerProfile: {
          create: {
            businessName: "Vidyora Jewelry Store",
            businessEmail: "jewelry@vidyora.com",
            businessPhone: "+91 9876543210",
            gstNumber: "27AABCU9603R1ZX",
            panNumber: "AABCU9603R",
            businessAddress: {
              addressLine1: "123 Jewelry Market",
              city: "Mumbai",
              state: "Maharashtra",
              postalCode: "400001",
            },
            bankAccountHolder: "Vidyora Jewelry Store",
            bankAccountNumber: "1234567890",
            bankIfscCode: "SBIN0001234",
            bankName: "State Bank of India",
            kycStatus: "VERIFIED",
            verificationStatus: "APPROVED",
          },
        },
      },
      include: { sellerProfile: true },
    });
    console.log("✅ Seller created");
  }

  // Create or get Jewelry category
  let category = await prisma.category.findUnique({
    where: { slug: "jewelry" },
  });

  if (!category) {
    console.log("Creating Jewelry category...");
    category = await prisma.category.create({
      data: {
        name: "Jewelry",
        slug: "jewelry",
        description:
          "Exquisite collection of gold, silver, diamond and gemstone jewelry",
        isActive: true,
        sortOrder: 1,
      },
    });
    console.log("✅ Category created");
  }

  console.log(`\n📦 Creating ${jewelryProducts.length} jewelry products...\n`);

  for (const product of jewelryProducts) {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { slug: product.slug },
      });

      if (existingProduct) {
        console.log(`⏭️  Skipping "${product.name}" - already exists`);
        continue;
      }

      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          brand: product.brand,
          basePrice: product.basePrice,
          compareAtPrice: product.compareAtPrice,
          tax: 3, // 3% GST on jewelry
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          sellerId: seller.sellerProfile!.sellerId,
          categoryId: category.id,
          attributes: product.attributes,
          thumbnail: null,
          variants: {
            create: {
              sku: `JWL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              price: product.basePrice,
              compareAtPrice: product.compareAtPrice,
              stock: Math.floor(Math.random() * 20) + 5, // Random stock 5-25
              weight: 0.05, // 50 grams average
              isActive: true,
            },
          },
          policy: {
            create: {
              returnAllowed: true,
              returnWindowDays: 7,
              replacementAllowed: true,
              replacementWindowDays: 7,
              warrantyAvailable: true,
              warrantyMonths: 12,
              policyDescription:
                "7 days return and replacement policy. 12 months warranty on manufacturing defects.",
            },
          },
        },
      });

      console.log(`✅ Created: ${product.name}`);
    } catch (error) {
      console.error(`❌ Error creating ${product.name}:`, error);
    }
  }

  console.log(`\n🎉 Seed completed successfully!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

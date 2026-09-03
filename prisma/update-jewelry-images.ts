import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const jewelryImages: Record<string, string> = {
  "diamond-solitaire-ring":
    "https://images.unsplash.com/photo-1605100804763-247f83b2bdcd?w=800&q=80",
  "gold-chain-necklace":
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
  "emerald-drop-earrings":
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  "pearl-string-necklace":
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  "ruby-engagement-ring":
    "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800&q=80",
  "gold-bangles-set":
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  "silver-oxidized-jhumka":
    "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80",
  "diamond-tennis-bracelet":
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
  "sapphire-pendant-necklace":
    "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80",
  "gold-hoop-earrings":
    "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80",
  "kundan-maang-tikka":
    "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
  "platinum-wedding-band":
    "https://images.unsplash.com/photo-1515626553181-0f218cb03f14?w=800&q=80",
  "coral-beaded-necklace":
    "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80",
  "rose-gold-charm-bracelet":
    "https://images.unsplash.com/photo-1611652022419-a73ae642c8fc?w=800&q=80",
  "amethyst-ring-set":
    "https://images.unsplash.com/photo-1603561591411-709570eaee86?w=800&q=80",
  "antique-gold-choker":
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
  "turquoise-pendant-set":
    "https://images.unsplash.com/photo-1611652022419-a73ae642c8fc?w=800&q=80",
  "diamond-stud-earrings":
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  "gold-anklet-pair":
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  "cubic-zirconia-cocktail-ring":
    "https://images.unsplash.com/photo-1605100804763-247f83b2bdcd?w=800&q=80",
};

async function main() {
  console.log("Updating jewelry product images...");

  for (const [slug, thumbnail] of Object.entries(jewelryImages)) {
    const product = await prisma.product.update({
      where: { slug },
      data: { thumbnail },
    });

    const existingImage = await prisma.productImage.findFirst({
      where: { productId: product.id, url: thumbnail },
    });

    if (!existingImage) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: thumbnail,
          altText: product.name,
          sortOrder: 0,
        },
      });
    }

    console.log(`Updated ${product.name}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

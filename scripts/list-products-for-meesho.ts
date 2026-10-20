import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", approvalStatus: "APPROVED" },
    include: {
      category: { select: { name: true, slug: true } },
      variants: {
        select: {
          sku: true,
          price: true,
          stock: true,
          attributes: true,
          isActive: true,
          weight: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, kind: true, role: true, sortOrder: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category?.name,
    categorySlug: p.category?.slug,
    brand: p.brand,
    description: (p.description || "").slice(0, 220),
    skus: p.variants
      .filter((v) => v.isActive)
      .map((v) => ({
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        weight: v.weight,
        attrs: v.attributes,
      })),
    images: p.images.slice(0, 8).map((i) => i.url),
    imageCount: p.images.length,
  }));

  console.log(JSON.stringify({ count: rows.length, products: rows }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

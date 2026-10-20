/**
 * Backfill metaTitle / metaDescription for active products missing SEO fields.
 * Safe to re-run — only fills empty fields.
 *
 *   npx tsx scripts/backfill-product-seo-meta.ts
 */
import { PrismaClient } from "@prisma/client";
import { buildProductSeoMeta } from "../lib/seo/product-meta";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", approvalStatus: "APPROVED" },
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      metaTitle: true,
      metaDescription: true,
      category: { select: { name: true } },
    },
  });

  let updated = 0;
  for (const product of products) {
    const needsTitle = !product.metaTitle?.trim();
    const needsDesc = !product.metaDescription?.trim();
    if (!needsTitle && !needsDesc) continue;

    const seo = buildProductSeoMeta({
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryName: product.category?.name,
      // Force rebuild for empty fields only
      metaTitle: needsTitle ? null : product.metaTitle,
      metaDescription: needsDesc ? null : product.metaDescription,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(needsTitle ? { metaTitle: seo.title } : {}),
        ...(needsDesc ? { metaDescription: seo.description } : {}),
      },
    });
    updated += 1;
    console.log(`✓ ${product.name}`);
  }

  console.log(`Done. Updated ${updated} / ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

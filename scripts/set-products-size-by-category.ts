/**
 * Set product size from category/name rules:
 *   Rings → Adjustable
 *   Bracelets / Bangles → Free Size
 *   Earrings / Nose pins → One Size
 *   Necklaces / Chains / Pendants → 18 inches
 *   else → Free Size
 *
 * Usage: npx tsx scripts/set-products-size-by-category.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { suggestProductSize } from "../lib/products/size-options";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      attributes: true,
      category: { select: { name: true, slug: true } },
    },
  });

  console.log(`Updating size on ${products.length} products…`);
  let updated = 0;

  for (const product of products) {
    const size = suggestProductSize({
      name: product.name,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
    });

    const prev =
      product.attributes &&
      typeof product.attributes === "object" &&
      !Array.isArray(product.attributes)
        ? (product.attributes as Record<string, unknown>)
        : {};

    const next: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(prev).map(([k, v]) => [k, v == null ? "" : String(v)]),
      ),
      size,
    };

    await prisma.product.update({
      where: { id: product.id },
      data: { attributes: next as Prisma.InputJsonValue },
    });
    updated += 1;
    console.log(
      `  ✓ ${product.name} [${product.category?.name || "—"}] → ${size}`,
    );
  }

  console.log(`Done. Updated ${updated} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

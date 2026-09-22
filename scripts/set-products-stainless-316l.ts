/**
 * Ensure every non-archived product has:
 *   metal = "Stainless Steel"
 *   quality = "316L"
 * so PLP cards dynamically render "STAINLESS STEEL · 316L".
 *
 * Usage: npx tsx scripts/set-products-stainless-316l.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, name: true, attributes: true },
  });

  console.log(`Updating ${products.length} products…`);

  let updated = 0;
  for (const product of products) {
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
      metal: "Stainless Steel",
      quality: "316L",
    };

    await prisma.product.update({
      where: { id: product.id },
      data: { attributes: next as Prisma.InputJsonValue },
    });
    updated += 1;
    console.log(`  ✓ ${product.name}`);
  }

  console.log(`Done. Updated ${updated} products → Stainless Steel / 316L.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

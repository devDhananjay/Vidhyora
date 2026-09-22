/**
 * Set return + replacement policy to 5 days for every non-archived product.
 *
 * Usage: npx tsx scripts/set-products-policy-5-days.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DAYS = 5;

async function main() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      policy: { select: { id: true } },
    },
  });

  console.log(`Updating policy on ${products.length} products → ${DAYS} days…`);

  let updated = 0;
  let created = 0;

  for (const product of products) {
    if (product.policy) {
      await prisma.productPolicy.update({
        where: { id: product.policy.id },
        data: {
          returnAllowed: true,
          returnWindowDays: DAYS,
          replacementAllowed: true,
          replacementWindowDays: DAYS,
        },
      });
      updated += 1;
    } else {
      await prisma.productPolicy.create({
        data: {
          productId: product.id,
          returnAllowed: true,
          returnWindowDays: DAYS,
          replacementAllowed: true,
          replacementWindowDays: DAYS,
        },
      });
      created += 1;
    }
    console.log(`  ✓ ${product.name}`);
  }

  console.log(
    `Done. Updated ${updated}, created ${created} policies → ${DAYS}-day return & replacement.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

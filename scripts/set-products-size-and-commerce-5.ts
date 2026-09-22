/**
 * Ensure every non-archived product has size = "Adjustable" (when missing),
 * and site commerce returnWindowDays = 5.
 *
 * Usage: npx tsx scripts/set-products-size-and-commerce-5.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const SIZE = "Adjustable";
const DAYS = 5;
const SITE_SETTINGS_ID = "default";

async function main() {
  const products = await prisma.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    select: { id: true, name: true, attributes: true },
  });

  console.log(`Updating size on ${products.length} products…`);
  let sizeUpdated = 0;

  for (const product of products) {
    const prev =
      product.attributes &&
      typeof product.attributes === "object" &&
      !Array.isArray(product.attributes)
        ? (product.attributes as Record<string, unknown>)
        : {};

    const existingSize =
      typeof prev.size === "string" ? prev.size.trim() : "";
    if (existingSize) {
      console.log(`  · ${product.name} (size already: ${existingSize})`);
      continue;
    }

    const next: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(prev).map(([k, v]) => [k, v == null ? "" : String(v)]),
      ),
      size: SIZE,
    };

    await prisma.product.update({
      where: { id: product.id },
      data: { attributes: next as Prisma.InputJsonValue },
    });
    sizeUpdated += 1;
    console.log(`  ✓ ${product.name} → size ${SIZE}`);
  }

  // Also refresh policies to 5-day return + replacement
  const policyResult = await prisma.productPolicy.updateMany({
    data: {
      returnAllowed: true,
      returnWindowDays: DAYS,
      replacementAllowed: true,
      replacementWindowDays: DAYS,
    },
  });

  // Commerce site setting
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (row?.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    const data = row.data as Record<string, unknown>;
    const commerce =
      data.commerce &&
      typeof data.commerce === "object" &&
      !Array.isArray(data.commerce)
        ? { ...(data.commerce as Record<string, unknown>) }
        : {};
    commerce.returnWindowDays = DAYS;
    await prisma.siteSettings.update({
      where: { id: SITE_SETTINGS_ID },
      data: {
        data: { ...data, commerce } as Prisma.InputJsonValue,
      },
    });
    console.log(`Commerce returnWindowDays → ${DAYS}`);
  } else {
    console.log("No site settings row — skipped commerce update");
  }

  console.log(
    `Done. Size set on ${sizeUpdated} products; policies refreshed: ${policyResult.count}.`,
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

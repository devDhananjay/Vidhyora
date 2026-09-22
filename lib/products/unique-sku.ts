import prisma from "@/lib/prisma";

/**
 * Ensure each SKU is globally unique on ProductVariant (and unique within the batch).
 * If a SKU is taken, append a short unique suffix.
 */
export async function ensureUniqueVariantSkus(
  skus: string[],
  options?: { excludeProductId?: string },
): Promise<string[]> {
  const used = new Set<string>();
  const result: string[] = [];

  for (let index = 0; index < skus.length; index++) {
    const raw = skus[index]?.trim();
    const base = (
      raw ||
      `SKU-${Date.now().toString(36).toUpperCase()}-${index + 1}`
    ).slice(0, 40);

    let candidate = base;
    let attempt = 0;

    while (attempt < 25) {
      const key = candidate.toLowerCase();
      if (!used.has(key)) {
        const existing = await prisma.productVariant.findFirst({
          where: {
            sku: candidate,
            ...(options?.excludeProductId
              ? { productId: { not: options.excludeProductId } }
              : {}),
          },
          select: { id: true },
        });
        if (!existing) {
          used.add(key);
          result.push(candidate);
          break;
        }
      }

      attempt += 1;
      const stamp = `${Date.now().toString(36).toUpperCase().slice(-5)}${attempt}`;
      const suffix = `-${stamp}`;
      candidate = `${base.slice(0, Math.max(1, 50 - suffix.length))}${suffix}`;
    }

    if (result.length === index) {
      const fallback = `SKU-${Date.now().toString(36).toUpperCase()}${index}${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`.slice(0, 50);
      used.add(fallback.toLowerCase());
      result.push(fallback);
    }
  }

  return result;
}

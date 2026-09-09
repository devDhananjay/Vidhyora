"use server";

import prisma from "@/lib/prisma";

function normalizeCityKey(city: string) {
  return city.trim().toLowerCase();
}

export async function getPublicStores(filters?: {
  city?: string;
  q?: string;
}) {
  const city = filters?.city?.trim();
  const q = filters?.q?.trim();

  return prisma.storeLocation.findMany({
    where: {
      isActive: true,
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { address: { contains: q, mode: "insensitive" } },
              { state: { contains: q, mode: "insensitive" } },
              { postalCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
  });
}

/**
 * Unique active cities for the store-locator filters.
 * Dedupes in JS (trim + case-insensitive) so "Mumbai" / "mumbai " both map to one chip.
 */
export async function getStoreCities() {
  const rows = await prisma.storeLocation.findMany({
    where: { isActive: true },
    select: { city: true },
  });

  const byKey = new Map<string, string>();
  for (const row of rows) {
    const trimmed = row.city.trim();
    if (!trimmed) continue;
    const key = normalizeCityKey(trimmed);
    if (!byKey.has(key)) {
      byKey.set(key, trimmed);
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.localeCompare(b, "en-IN", { sensitivity: "base" }),
  );
}

"use server";

import prisma from "@/lib/prisma";

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
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
  });
}

export async function getStoreCities() {
  const rows = await prisma.storeLocation.findMany({
    where: { isActive: true },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city);
}

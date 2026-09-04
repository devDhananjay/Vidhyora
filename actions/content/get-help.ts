"use server";

import prisma from "@/lib/prisma";

export async function getPublicHelpArticles(filters?: {
  category?: string;
  q?: string;
}) {
  const category = filters?.category?.trim();
  const q = filters?.q?.trim();

  return prisma.helpArticle.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { question: "asc" }],
  });
}

export async function getHelpCategories() {
  const rows = await prisma.helpArticle.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}

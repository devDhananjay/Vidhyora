import prisma from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const baseUrl = getSiteUrl();

  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/store-locator`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const productPages: SitemapEntry[] = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const categoryPages: SitemapEntry[] = categories.map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? new Date(entry.lastModified).toISOString()
        : new Date().toISOString();
      return `<url>
<loc>${escapeXml(entry.url)}</loc>
<lastmod>${lastmod}</lastmod>
<changefreq>${entry.changeFrequency ?? "weekly"}</changefreq>
<priority>${entry.priority ?? 0.5}</priority>
</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

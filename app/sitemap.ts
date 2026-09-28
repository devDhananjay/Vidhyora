import { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/seo/sitemap-data";

/** Refresh catalog URLs hourly so new products appear without a full rebuild. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

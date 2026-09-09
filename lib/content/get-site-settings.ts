import prisma from "@/lib/prisma";
import { DEFAULT_SITE_SETTINGS } from "@/lib/content/site-settings-defaults";
import {
  siteSettingsSchema,
  type SiteSettingsData,
} from "@/lib/validations/site-settings";

export const SITE_SETTINGS_ID = "default";

export function defaultSiteSettings(): SiteSettingsData {
  return structuredClone(DEFAULT_SITE_SETTINGS);
}

export function parseSiteSettings(raw: unknown): SiteSettingsData | null {
  const parsed = siteSettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Public storefront contact + social settings (DB with defaults). */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    if (!row) return defaultSiteSettings();

    const config = parseSiteSettings(row.data);
    if (!config) {
      console.error("Invalid SiteSettings JSON — using defaults");
      return defaultSiteSettings();
    }
    return config;
  } catch (error) {
    console.error("getSiteSettings error:", error);
    return defaultSiteSettings();
  }
}

export async function getSiteSettingsForAdmin(): Promise<{
  data: SiteSettingsData;
  updatedAt: Date | null;
  source: "database" | "default";
}> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    if (!row) {
      return {
        data: defaultSiteSettings(),
        updatedAt: null,
        source: "default",
      };
    }

    const config = parseSiteSettings(row.data);
    if (!config) {
      return {
        data: defaultSiteSettings(),
        updatedAt: row.updatedAt,
        source: "default",
      };
    }

    return {
      data: config,
      updatedAt: row.updatedAt,
      source: "database",
    };
  } catch (error) {
    console.error("getSiteSettingsForAdmin error:", error);
    return {
      data: defaultSiteSettings(),
      updatedAt: null,
      source: "default",
    };
  }
}

export async function ensureSiteSettingsSeeded(updatedBy?: string) {
  try {
    const existing = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    if (existing) return existing;

    return await prisma.siteSettings.create({
      data: {
        id: SITE_SETTINGS_ID,
        data: defaultSiteSettings(),
        updatedBy: updatedBy ?? null,
      },
    });
  } catch (error) {
    console.error("ensureSiteSettingsSeeded error:", error);
    return null;
  }
}

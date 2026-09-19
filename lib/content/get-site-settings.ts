import prisma from "@/lib/prisma";
import { DEFAULT_SITE_SETTINGS } from "@/lib/content/site-settings-defaults";
import {
  siteSettingsSchema,
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_INTEGRATIONS_SETTINGS,
  type SiteSettingsData,
} from "@/lib/validations/site-settings";

export const SITE_SETTINGS_ID = "default";

export function defaultSiteSettings(): SiteSettingsData {
  return structuredClone(DEFAULT_SITE_SETTINGS);
}

export function parseSiteSettings(raw: unknown): SiteSettingsData | null {
  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    business: {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...(parsed.data.business ?? {}),
    },
    commerce: {
      ...DEFAULT_COMMERCE_SETTINGS,
      ...(parsed.data.commerce ?? {}),
    },
    integrations: {
      ...DEFAULT_INTEGRATIONS_SETTINGS,
      ...(parsed.data.integrations ?? {}),
    },
  };
}

/** Public storefront contact + social settings (DB with defaults). */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    const row = await prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
    });
    const base = row
      ? parseSiteSettings(row.data) ?? defaultSiteSettings()
      : defaultSiteSettings();

    return {
      ...base,
      social: {
        ...base.social,
        instagram:
          base.social?.instagram?.trim() ||
          DEFAULT_SITE_SETTINGS.social.instagram,
        facebook: base.social?.facebook?.trim() || "",
        twitter: base.social?.twitter?.trim() || "",
        youtube: base.social?.youtube?.trim() || "",
      },
      business: {
        ...DEFAULT_BUSINESS_SETTINGS,
        ...(base.business ?? {}),
        legalName:
          process.env.INVOICE_LEGAL_NAME?.trim() ||
          base.business?.legalName ||
          DEFAULT_BUSINESS_SETTINGS.legalName,
        gstin:
          process.env.INVOICE_GSTIN?.trim() ||
          base.business?.gstin ||
          DEFAULT_BUSINESS_SETTINGS.gstin,
        pan:
          process.env.INVOICE_PAN?.trim() ||
          base.business?.pan ||
          DEFAULT_BUSINESS_SETTINGS.pan,
        addressLine1:
          process.env.INVOICE_ADDRESS_LINE1?.trim() ||
          base.business?.addressLine1 ||
          "",
        addressLine2:
          process.env.INVOICE_ADDRESS_LINE2?.trim() ||
          base.business?.addressLine2 ||
          "",
        city:
          process.env.INVOICE_CITY?.trim() || base.business?.city || "",
        state:
          process.env.INVOICE_STATE?.trim() ||
          base.business?.state ||
          DEFAULT_BUSINESS_SETTINGS.state,
        postalCode:
          process.env.INVOICE_POSTAL_CODE?.trim() ||
          base.business?.postalCode ||
          "",
        originState:
          process.env.INVOICE_ORIGIN_STATE?.trim() ||
          base.business?.originState ||
          base.business?.state ||
          DEFAULT_BUSINESS_SETTINGS.originState,
      },
    };
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

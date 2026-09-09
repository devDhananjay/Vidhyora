"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";
import {
  defaultSiteSettings,
  ensureSiteSettingsSeeded,
  getSiteSettingsForAdmin,
  SITE_SETTINGS_ID,
} from "@/lib/content/get-site-settings";
import {
  siteSettingsSchema,
  type SiteSettingsData,
} from "@/lib/validations/site-settings";

function revalidatePublicContact() {
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/help");
  revalidatePath("/shipping");
  revalidatePath("/privacy");
  revalidatePath("/privacy-policy");
  revalidatePath("/terms-and-conditions");
  revalidatePath("/offers");
  revalidatePath("/returns");
  revalidatePath("/admin/settings");
}

export async function saveSiteSettings(
  raw: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = siteSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid settings",
      };
    }

    const row = await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        data: parsed.data,
        updatedBy: session.user.id,
      },
      update: {
        data: parsed.data,
        updatedBy: session.user.id,
      },
    });

    revalidatePublicContact();

    return {
      success: true,
      data: { updatedAt: row.updatedAt.toISOString() },
    };
  } catch (error) {
    console.error("saveSiteSettings error:", error);
    return { success: false, error: "Failed to save website settings" };
  }
}

export async function resetSiteSettings(): Promise<
  ActionResult<{ data: SiteSettingsData }>
> {
  try {
    const session = await requireAdmin();
    const data = defaultSiteSettings();

    await prisma.siteSettings.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        data,
        updatedBy: session.user.id,
      },
      update: {
        data,
        updatedBy: session.user.id,
      },
    });

    revalidatePublicContact();
    return { success: true, data: { data } };
  } catch (error) {
    console.error("resetSiteSettings error:", error);
    return { success: false, error: "Failed to reset website settings" };
  }
}

export async function loadSiteSettingsAdmin(): Promise<
  ActionResult<{
    data: SiteSettingsData;
    updatedAt: string | null;
    source: "database" | "default";
  }>
> {
  try {
    await requireAdmin();
    await ensureSiteSettingsSeeded();
    const result = await getSiteSettingsForAdmin();
    return {
      success: true,
      data: {
        data: result.data,
        updatedAt: result.updatedAt?.toISOString() ?? null,
        source: result.source,
      },
    };
  } catch (error) {
    console.error("loadSiteSettingsAdmin error:", error);
    return { success: false, error: "Failed to load website settings" };
  }
}

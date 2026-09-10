"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";
import {
  defaultHomepageConfig,
  ensureHomepageConfigSeeded,
  getHomepageConfigForAdmin,
  HOMEPAGE_CONFIG_ID,
} from "@/lib/content/get-homepage";
import {
  homepageConfigSchema,
  type HomepageConfigData,
} from "@/lib/validations/homepage";

export async function loadHomepageAdmin(): Promise<
  ActionResult<{
    data: HomepageConfigData;
    updatedAt: string | null;
    source: "database" | "default";
  }>
> {
  try {
    await requireAdmin();
    await ensureHomepageConfigSeeded();
    const result = await getHomepageConfigForAdmin();
    return {
      success: true,
      data: {
        data: result.data,
        updatedAt: result.updatedAt?.toISOString() ?? null,
        source: result.source,
      },
    };
  } catch (error) {
    console.error("loadHomepageAdmin error:", error);
    return { success: false, error: "Failed to load homepage config" };
  }
}

export async function saveHomepageConfig(
  raw: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = homepageConfigSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid homepage data",
      };
    }

    const row = await prisma.homepageConfig.upsert({
      where: { id: HOMEPAGE_CONFIG_ID },
      create: {
        id: HOMEPAGE_CONFIG_ID,
        data: parsed.data,
        updatedBy: session.user.id,
      },
      update: {
        data: parsed.data,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");

    return {
      success: true,
      data: { updatedAt: row.updatedAt.toISOString() },
    };
  } catch (error) {
    console.error("saveHomepageConfig error:", error);
    return { success: false, error: "Failed to save homepage config" };
  }
}

export async function resetHomepageConfig(): Promise<
  ActionResult<{ data: HomepageConfigData }>
> {
  try {
    const session = await requireAdmin();
    const data = defaultHomepageConfig();

    await prisma.homepageConfig.upsert({
      where: { id: HOMEPAGE_CONFIG_ID },
      create: {
        id: HOMEPAGE_CONFIG_ID,
        data,
        updatedBy: session.user.id,
      },
      update: {
        data,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");

    return { success: true, data: { data } };
  } catch (error) {
    console.error("resetHomepageConfig error:", error);
    return { success: false, error: "Failed to reset homepage config" };
  }
}

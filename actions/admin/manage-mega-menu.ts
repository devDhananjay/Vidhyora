"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";
import {
  defaultMegaMenuConfig,
  ensureMegaMenuConfigSeeded,
  getMegaMenuConfigForAdmin,
  MEGA_MENU_CONFIG_ID,
  parseMegaMenuConfig,
} from "@/lib/nav/get-mega-menu";
import {
  megaMenuConfigSchema,
  type MegaMenuConfigData,
} from "@/lib/validations/mega-menu";

export async function loadMegaMenuAdmin(): Promise<
  ActionResult<{
    data: MegaMenuConfigData;
    updatedAt: string | null;
    source: "database" | "default";
  }>
> {
  try {
    await requireAdmin();
    await ensureMegaMenuConfigSeeded();
    const result = await getMegaMenuConfigForAdmin();
    return {
      success: true,
      data: {
        data: result.data,
        updatedAt: result.updatedAt?.toISOString() ?? null,
        source: result.source,
      },
    };
  } catch (error) {
    console.error("loadMegaMenuAdmin error:", error);
    return { success: false, error: "Failed to load mega menu" };
  }
}

export async function saveMegaMenuConfig(
  raw: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = megaMenuConfigSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid mega menu data",
      };
    }

    // Extra guard: unique tab ids
    const ids = parsed.data.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) {
      return { success: false, error: "Each tab needs a unique id" };
    }

    const row = await prisma.megaMenuConfig.upsert({
      where: { id: MEGA_MENU_CONFIG_ID },
      create: {
        id: MEGA_MENU_CONFIG_ID,
        data: parsed.data,
        updatedBy: session.user.id,
      },
      update: {
        data: parsed.data,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/mega-menu");
    // Layout header is used sitewide
    revalidatePath("/", "layout");

    return {
      success: true,
      data: { updatedAt: row.updatedAt.toISOString() },
    };
  } catch (error) {
    console.error("saveMegaMenuConfig error:", error);
    return { success: false, error: "Failed to save mega menu" };
  }
}

export async function resetMegaMenuConfig(): Promise<
  ActionResult<{ data: MegaMenuConfigData }>
> {
  try {
    const session = await requireAdmin();
    const data = defaultMegaMenuConfig();

    await prisma.megaMenuConfig.upsert({
      where: { id: MEGA_MENU_CONFIG_ID },
      create: {
        id: MEGA_MENU_CONFIG_ID,
        data,
        updatedBy: session.user.id,
      },
      update: {
        data,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/mega-menu");
    revalidatePath("/", "layout");

    return { success: true, data: { data } };
  } catch (error) {
    console.error("resetMegaMenuConfig error:", error);
    return { success: false, error: "Failed to reset mega menu" };
  }
}

export async function saveMegaMenuFromJsonString(
  jsonText: string,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    await requireAdmin();
    let raw: unknown;
    try {
      raw = JSON.parse(jsonText);
    } catch {
      return { success: false, error: "Invalid JSON" };
    }

    // Accept either full config or bare items array
    const normalized =
      raw && typeof raw === "object" && "items" in (raw as object)
        ? raw
        : { version: 1, items: raw };

    const config = parseMegaMenuConfig(normalized);
    if (!config) {
      // try coerce version
      const withVersion = {
        version: 1 as const,
        items: (normalized as { items?: unknown }).items,
      };
      const retry = megaMenuConfigSchema.safeParse(withVersion);
      if (!retry.success) {
        return {
          success: false,
          error: retry.error.issues[0]?.message || "Invalid mega menu shape",
        };
      }
      return saveMegaMenuConfig(retry.data);
    }

    return saveMegaMenuConfig(config);
  } catch (error) {
    console.error("saveMegaMenuFromJsonString error:", error);
    return { success: false, error: "Failed to save mega menu" };
  }
}

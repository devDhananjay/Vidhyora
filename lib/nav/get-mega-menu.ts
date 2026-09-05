import prisma from "@/lib/prisma";
import { MEGA_MENU, type MegaMenuItem } from "@/lib/nav/mega-menu-data";
import {
  megaMenuConfigSchema,
  type MegaMenuConfigData,
} from "@/lib/validations/mega-menu";

export const MEGA_MENU_CONFIG_ID = "default";

export function defaultMegaMenuConfig(): MegaMenuConfigData {
  return {
    version: 1,
    items: MEGA_MENU.map((item) => ({
      ...item,
      isActive: true,
    })),
  };
}

export function parseMegaMenuConfig(raw: unknown): MegaMenuConfigData | null {
  const parsed = megaMenuConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Active mega menu tabs for the storefront (DB with hardcoded fallback). */
export async function getMegaMenuItems(): Promise<MegaMenuItem[]> {
  try {
    const row = await prisma.megaMenuConfig.findUnique({
      where: { id: MEGA_MENU_CONFIG_ID },
    });

    if (!row) {
      return MEGA_MENU;
    }

    const config = parseMegaMenuConfig(row.data);
    if (!config) {
      console.error("Invalid MegaMenuConfig JSON — using default MEGA_MENU");
      return MEGA_MENU;
    }

    return config.items
      .filter((item) => item.isActive !== false)
      .map(({ isActive: _ignored, ...item }) => item);
  } catch (error) {
    // Table may not exist yet before migrate
    console.error("getMegaMenuItems error:", error);
    return MEGA_MENU;
  }
}

export async function getMegaMenuConfigForAdmin(): Promise<{
  data: MegaMenuConfigData;
  updatedAt: Date | null;
  source: "database" | "default";
}> {
  try {
    const row = await prisma.megaMenuConfig.findUnique({
      where: { id: MEGA_MENU_CONFIG_ID },
    });

    if (!row) {
      return {
        data: defaultMegaMenuConfig(),
        updatedAt: null,
        source: "default",
      };
    }

    const config = parseMegaMenuConfig(row.data);
    if (!config) {
      return {
        data: defaultMegaMenuConfig(),
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
    console.error("getMegaMenuConfigForAdmin error:", error);
    return {
      data: defaultMegaMenuConfig(),
      updatedAt: null,
      source: "default",
    };
  }
}

/** Ensure a row exists (seed from hardcoded defaults). */
export async function ensureMegaMenuConfigSeeded(updatedBy?: string) {
  const existing = await prisma.megaMenuConfig.findUnique({
    where: { id: MEGA_MENU_CONFIG_ID },
  });
  if (existing) return existing;

  return prisma.megaMenuConfig.create({
    data: {
      id: MEGA_MENU_CONFIG_ID,
      data: defaultMegaMenuConfig(),
      updatedBy: updatedBy ?? null,
    },
  });
}

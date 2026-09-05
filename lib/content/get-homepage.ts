import prisma from "@/lib/prisma";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/content/homepage-defaults";
import {
  homepageConfigSchema,
  type HomepageConfigData,
} from "@/lib/validations/homepage";

export const HOMEPAGE_CONFIG_ID = "default";

export function defaultHomepageConfig(): HomepageConfigData {
  return structuredClone(DEFAULT_HOMEPAGE_CONFIG);
}

/**
 * Migrate older saved JSON (e.g. styleStories.videoSrc only) into the
 * current schema before zod validation, so production DB rows keep working.
 */
export function migrateHomepageRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const data = { ...(raw as Record<string, unknown>) };
  const defaults = DEFAULT_HOMEPAGE_CONFIG;

  const style = data.styleStories;
  if (style && typeof style === "object") {
    const s = { ...(style as Record<string, unknown>) };
    if (!Array.isArray(s.stories)) {
      const shared =
        typeof s.videoSrc === "string" && s.videoSrc.length > 0
          ? s.videoSrc
          : defaults.styleStories.stories[0]?.media;
      s.stories = defaults.styleStories.stories.map((story) => ({
        ...story,
        media: shared || story.media,
      }));
      delete s.videoSrc;
    }
    data.styleStories = s;
  } else {
    data.styleStories = defaults.styleStories;
  }

  if (!data.exploreTraditions) {
    data.exploreTraditions = defaults.exploreTraditions;
  }
  if (!data.weddingMoodboard) {
    data.weddingMoodboard = defaults.weddingMoodboard;
  }

  return data;
}

export function parseHomepageConfig(raw: unknown): HomepageConfigData | null {
  const migrated = migrateHomepageRaw(raw);
  const parsed = homepageConfigSchema.safeParse(migrated);
  return parsed.success ? parsed.data : null;
}

/** Homepage marketing config for the storefront (DB with hardcoded fallback). */
export async function getHomepageConfig(): Promise<HomepageConfigData> {
  try {
    const row = await prisma.homepageConfig.findUnique({
      where: { id: HOMEPAGE_CONFIG_ID },
    });

    if (!row) {
      return defaultHomepageConfig();
    }

    const config = parseHomepageConfig(row.data);
    if (!config) {
      console.error("Invalid HomepageConfig JSON — using defaults");
      return defaultHomepageConfig();
    }

    return config;
  } catch (error) {
    console.error("getHomepageConfig error:", error);
    return defaultHomepageConfig();
  }
}

export async function getHomepageConfigForAdmin(): Promise<{
  data: HomepageConfigData;
  updatedAt: Date | null;
  source: "database" | "default";
}> {
  try {
    const row = await prisma.homepageConfig.findUnique({
      where: { id: HOMEPAGE_CONFIG_ID },
    });

    if (!row) {
      return {
        data: defaultHomepageConfig(),
        updatedAt: null,
        source: "default",
      };
    }

    const config = parseHomepageConfig(row.data);
    if (!config) {
      return {
        data: defaultHomepageConfig(),
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
    console.error("getHomepageConfigForAdmin error:", error);
    return {
      data: defaultHomepageConfig(),
      updatedAt: null,
      source: "default",
    };
  }
}

/** Ensure a row exists (seed from hardcoded defaults). */
export async function ensureHomepageConfigSeeded(updatedBy?: string) {
  const existing = await prisma.homepageConfig.findUnique({
    where: { id: HOMEPAGE_CONFIG_ID },
  });
  if (existing) return existing;

  return prisma.homepageConfig.create({
    data: {
      id: HOMEPAGE_CONFIG_ID,
      data: defaultHomepageConfig(),
      updatedBy: updatedBy ?? null,
    },
  });
}

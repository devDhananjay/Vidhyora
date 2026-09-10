import { z } from "zod";

export const homepageCollectionCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().min(1),
  href: z.string().min(1),
  span: z.enum(["tall", "normal"]).optional(),
});

export const homepageCategoryItemSchema = z.object({
  name: z.string().min(1),
  href: z.string().min(1),
  image: z.string().min(1),
});

export const homepageTrendingItemSchema = z.object({
  title: z.string().min(1),
  href: z.string().min(1),
  image: z.string().min(1),
});

export const homepageHeroSlideSchema = z.object({
  id: z.string().min(1),
  image: z.string().min(1),
  alt: z.string().min(1),
  panelColor: z.string().min(1),
  panelClassName: z.string().min(1),
  contentAlign: z.enum(["right", "right-soft"]),
  eyebrow: z.string().optional(),
  titleMode: z.enum(["script", "stacked", "serif"]),
  titleLines: z.array(z.string().min(1)).min(1),
  subtitle: z.string().min(1),
  cta: z.string().min(1),
  ctaHref: z.string().min(1),
  ctaClassName: z.string().min(1),
  /** When false, slide is hidden on the storefront. Default true. */
  isActive: z.boolean().optional(),
  /** ISO datetime — empty/null = no start bound. */
  visibleFrom: z.string().optional().nullable(),
  /** ISO datetime — empty/null = no end bound. */
  visibleUntil: z.string().optional().nullable(),
});

export const homepageLookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  image: z.string().min(1),
  href: z.string().min(1),
});

export const homepageStyleStorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  /** Main media — image or video (autoplays when video). */
  media: z.string().min(1),
  /** Cover / poster image shown behind video or when inactive. */
  poster: z.string().min(1),
  href: z.string().min(1),
});

export const homepageTraditionMomentSchema = z.object({
  label: z.string().min(1),
  image: z.string().min(1),
});

export const homepageTraditionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  image: z.string().min(1),
  href: z.string().min(1),
  moments: z.array(homepageTraditionMomentSchema).min(1),
});

export const homepageMoodboardPolaroidSchema = z.object({
  caption: z.string().min(1),
  image: z.string().min(1),
  rotate: z.number(),
  top: z.string().min(1),
  left: z.string().min(1),
  w: z.number(),
  z: z.number(),
});

export const homepageMoodboardNoteSchema = z.object({
  label: z.string().optional(),
  text: z.string().min(1),
  rotate: z.number(),
  top: z.string().min(1),
  left: z.string().min(1),
  w: z.number(),
  z: z.number(),
});

export const HOMEPAGE_SECTION_IDS = [
  "hero",
  "collections",
  "categories",
  "trending",
  "world",
  "weddingMoodboard",
  "exploreTraditions",
  "featured",
  "chooseYourLook",
  "styleStories",
  "assurance",
  "exchange",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export const DEFAULT_HOMEPAGE_VISIBILITY: Record<HomepageSectionId, boolean> = {
  hero: true,
  collections: true,
  categories: true,
  trending: true,
  world: true,
  weddingMoodboard: true,
  exploreTraditions: true,
  featured: true,
  chooseYourLook: true,
  styleStories: true,
  assurance: true,
  exchange: true,
};

export const homepageSectionVisibilitySchema = z
  .object({
    hero: z.boolean().default(true),
    collections: z.boolean().default(true),
    categories: z.boolean().default(true),
    trending: z.boolean().default(true),
    world: z.boolean().default(true),
    weddingMoodboard: z.boolean().default(true),
    exploreTraditions: z.boolean().default(true),
    featured: z.boolean().default(true),
    chooseYourLook: z.boolean().default(true),
    styleStories: z.boolean().default(true),
    assurance: z.boolean().default(true),
    exchange: z.boolean().default(true),
  })
  .default(DEFAULT_HOMEPAGE_VISIBILITY);

export const homepageSectionScheduleEntrySchema = z.object({
  /** ISO date string (date or datetime). Empty/null = no start bound. */
  visibleFrom: z.string().optional().nullable(),
  /** ISO date string (date or datetime). Empty/null = no end bound. */
  visibleUntil: z.string().optional().nullable(),
});

export const homepageSectionScheduleSchema = z
  .object({
    hero: homepageSectionScheduleEntrySchema.optional(),
    collections: homepageSectionScheduleEntrySchema.optional(),
    categories: homepageSectionScheduleEntrySchema.optional(),
    trending: homepageSectionScheduleEntrySchema.optional(),
    world: homepageSectionScheduleEntrySchema.optional(),
    weddingMoodboard: homepageSectionScheduleEntrySchema.optional(),
    exploreTraditions: homepageSectionScheduleEntrySchema.optional(),
    featured: homepageSectionScheduleEntrySchema.optional(),
    chooseYourLook: homepageSectionScheduleEntrySchema.optional(),
    styleStories: homepageSectionScheduleEntrySchema.optional(),
    assurance: homepageSectionScheduleEntrySchema.optional(),
    exchange: homepageSectionScheduleEntrySchema.optional(),
  })
  .optional();

export const DEFAULT_HOMEPAGE_SECTION_ORDER: HomepageSectionId[] = [
  ...HOMEPAGE_SECTION_IDS,
];

export const homepageConfigSchema = z.object({
  version: z.literal(1),
  visibility: homepageSectionVisibilitySchema.optional(),
  /** Display order of homepage sections (ids). Missing ids append in default order. */
  sectionOrder: z.array(z.enum(HOMEPAGE_SECTION_IDS)).optional(),
  /** Optional date windows when a section should appear. */
  sectionSchedule: homepageSectionScheduleSchema,
  collections: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    cards: z.array(homepageCollectionCardSchema).min(1),
  }),
  categories: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(homepageCategoryItemSchema).min(1),
    viewAll: z.object({
      countLabel: z.string().min(1),
      caption: z.string().min(1),
      href: z.string().min(1),
    }),
  }),
  trending: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(homepageTrendingItemSchema).min(1),
  }),
  world: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    wedding: z.object({
      title: z.string().min(1),
      subtitle: z.string().min(1),
      image: z.string().min(1),
      href: z.string().min(1),
    }),
    diamond: z.object({
      title: z.string().min(1),
      videoSrc: z.string().min(1),
      href: z.string().min(1),
    }),
    gold: z.object({
      title: z.string().min(1),
      image: z.string().min(1),
      href: z.string().min(1),
    }),
  }),
  featured: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    viewAllHref: z.string().min(1),
  }),
  assurance: z.object({
    titlePrefix: z.string().min(1),
    titleAccent: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(z.object({ label: z.string().min(1) })).length(3),
  }),
  exchange: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    items: z.array(z.object({ label: z.string().min(1) })).length(4),
  }),
  hero: z.object({
    slides: z.array(homepageHeroSlideSchema).min(1),
  }),
  chooseYourLook: z.object({
    title: z.string().min(1),
    looks: z.array(homepageLookSchema).min(1),
  }),
  styleStories: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    stories: z.array(homepageStyleStorySchema).min(1),
  }),
  exploreTraditions: z.object({
    title: z.string().min(1),
    items: z.array(homepageTraditionSchema).min(1),
  }),
  weddingMoodboard: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    subtitle: z.string().min(1),
    ctaLabel: z.string().min(1),
    href: z.string().min(1),
    polaroids: z.array(homepageMoodboardPolaroidSchema).min(1),
    notes: z.array(homepageMoodboardNoteSchema).min(1),
  }),
});

export type HomepageConfigData = z.infer<typeof homepageConfigSchema>;
export type HomepageHeroSlide = z.infer<typeof homepageHeroSlideSchema>;
export type HomepageLook = z.infer<typeof homepageLookSchema>;
export type HomepageStyleStory = z.infer<typeof homepageStyleStorySchema>;
export type HomepageTradition = z.infer<typeof homepageTraditionSchema>;
export type HomepageMoodboardPolaroid = z.infer<
  typeof homepageMoodboardPolaroidSchema
>;
export type HomepageMoodboardNote = z.infer<typeof homepageMoodboardNoteSchema>;

function parseScheduleBound(value?: string | null): Date | null {
  if (!value || !String(value).trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinSchedule(
  schedule:
    | { visibleFrom?: string | null; visibleUntil?: string | null }
    | undefined,
  now: Date,
): boolean {
  if (!schedule) return true;
  const from = parseScheduleBound(schedule.visibleFrom);
  const until = parseScheduleBound(schedule.visibleUntil);
  if (from && now < from) return false;
  if (until && now > until) return false;
  return true;
}

export function resolveHomepageVisibility(
  config: HomepageConfigData,
  now: Date = new Date(),
): Record<HomepageSectionId, boolean> {
  const base = {
    ...DEFAULT_HOMEPAGE_VISIBILITY,
    ...(config.visibility ?? {}),
  };
  const schedule = config.sectionSchedule ?? {};
  const result = { ...base };
  for (const id of HOMEPAGE_SECTION_IDS) {
    if (!result[id]) continue;
    if (!isWithinSchedule(schedule[id], now)) {
      result[id] = false;
    }
  }
  return result;
}

/** Ordered section ids for rendering (all ids, including hidden — filter with visibility). */
export function resolveHomepageSectionOrder(
  config: HomepageConfigData,
): HomepageSectionId[] {
  const preferred = config.sectionOrder ?? [];
  const seen = new Set<HomepageSectionId>();
  const ordered: HomepageSectionId[] = [];
  for (const id of preferred) {
    if (HOMEPAGE_SECTION_IDS.includes(id) && !seen.has(id)) {
      ordered.push(id);
      seen.add(id);
    }
  }
  for (const id of DEFAULT_HOMEPAGE_SECTION_ORDER) {
    if (!seen.has(id)) ordered.push(id);
  }
  return ordered;
}

/** Hero slides that should render now (active + within schedule window). */
export function filterVisibleHeroSlides(
  slides: HomepageHeroSlide[],
  now: Date = new Date(),
): HomepageHeroSlide[] {
  return slides.filter(
    (slide) =>
      slide.isActive !== false &&
      isWithinSchedule(
        {
          visibleFrom: slide.visibleFrom,
          visibleUntil: slide.visibleUntil,
        },
        now,
      ),
  );
}

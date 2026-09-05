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

export const homepageConfigSchema = z.object({
  version: z.literal(1),
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

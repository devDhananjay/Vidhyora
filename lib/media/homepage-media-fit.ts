/**
 * Homepage CMS media canvas sizes — uploads are auto-cropped to these.
 * Hero matches storefront `md:aspect-[10/3]` (desktop banner frame).
 */
export const HOMEPAGE_MEDIA_FITS = {
  hero: {
    width: 1920,
    height: 576,
    /** 10:3 — same as hero slider on md+ */
    aspectLabel: "1920 × 576 px (10:3)",
    hint:
      "Required size: 1920 × 576 px (ratio 10:3). Image or video — upload will auto-crop to this size so the banner fills edge-to-edge with no side gaps.",
  },
  square: {
    width: 1200,
    height: 1200,
    aspectLabel: "1200 × 1200 px (1:1)",
    hint: "Required size: 1200 × 1200 px (square). Upload auto-crops to fit.",
  },
  wide: {
    width: 1600,
    height: 900,
    aspectLabel: "1600 × 900 px (16:9)",
    hint: "Required size: 1600 × 900 px (16:9). Upload auto-crops to fit.",
  },
} as const;

export type HomepageMediaFit = keyof typeof HOMEPAGE_MEDIA_FITS;

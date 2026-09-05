import { z } from "zod";

export const megaLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  image: z.string().min(1),
  swatch: z.string().optional(),
});

export const megaPanelSchema = z.object({
  kind: z.enum(["links", "photo-cards", "metals"]),
  items: z.array(megaLinkSchema),
});

export const megaMenuItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  layout: z.enum(["links", "cards", "gifts"]),
  sidebar: z.array(z.string().min(1)).min(1),
  links: z.array(megaLinkSchema),
  panels: z.record(z.string(), megaPanelSchema).optional(),
  banner: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    href: z.string().min(1),
    thumbs: z.array(z.string().min(1)),
  }),
  promo: z.object({
    image: z.string().min(1),
    title: z.string().min(1),
    cta: z.string().min(1),
    href: z.string().min(1),
  }),
  isActive: z.boolean().optional(),
});

export const megaMenuConfigSchema = z.object({
  version: z.literal(1),
  items: z.array(megaMenuItemSchema).min(1),
});

export type MegaMenuConfigData = z.infer<typeof megaMenuConfigSchema>;
export type MegaMenuItemInput = z.infer<typeof megaMenuItemSchema>;

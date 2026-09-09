import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    "Enter a full URL starting with https://",
  );

export const siteSettingsSchema = z.object({
  version: z.literal(1),
  contact: z.object({
    supportEmail: z.string().email("Enter a valid support email"),
    /** Display phone, e.g. +91 94114 41937 */
    supportPhone: z.string().min(8, "Phone is required"),
    /** Digits for WhatsApp (with country code), e.g. 919411441937 */
    whatsappNumber: z
      .string()
      .min(10, "WhatsApp number is required")
      .regex(/^\d+$/, "WhatsApp number must be digits only (with country code)"),
  }),
  social: z.object({
    instagram: optionalUrl,
    facebook: optionalUrl,
    twitter: optionalUrl,
    youtube: optionalUrl,
  }),
});

export type SiteSettingsData = z.infer<typeof siteSettingsSchema>;

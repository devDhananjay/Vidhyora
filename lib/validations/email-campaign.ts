import { z } from "zod";

export const campaignTypeSchema = z.enum([
  "WELCOME",
  "DROPOUT",
  "OFFER",
  "FESTIVAL",
]);

export const campaignAudienceSchema = z.enum([
  "ALL_CUSTOMERS",
  "ALL_USERS",
  "ALL_SELLERS",
  "CART_DROPOUT",
  "NEVER_ORDERED",
  "TEST",
  "CUSTOM_EMAILS",
]);

export const sendEmailCampaignSchema = z.object({
  type: campaignTypeSchema,
  audience: campaignAudienceSchema,
  subject: z.string().trim().min(4).max(160),
  headline: z.string().trim().min(4).max(160),
  body: z.string().trim().min(10).max(4000),
  ctaLabel: z.string().trim().min(2).max(48),
  ctaUrl: z.string().trim().min(1).max(500),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  eyebrow: z.string().trim().max(80).optional().or(z.literal("")),
  footnote: z.string().trim().max(240).optional().or(z.literal("")),
  customEmails: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type SendEmailCampaignInput = z.infer<typeof sendEmailCampaignSchema>;

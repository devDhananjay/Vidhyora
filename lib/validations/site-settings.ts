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

export const commerceSettingsSchema = z.object({
  gstPercent: z.coerce.number().min(0).max(40).default(3),
  freeShippingThreshold: z.coerce.number().min(0).max(1_000_000).default(500),
  shippingFee: z.coerce.number().min(0).max(10_000).default(50),
  codEnabled: z.boolean().default(true),
  razorpayEnabled: z.boolean().default(true),
  productApprovalRequired: z.boolean().default(true),
  reviewModeration: z.boolean().default(true),
  returnWindowDays: z.coerce.number().int().min(0).max(90).default(7),
  maxCodOrderAmount: z.coerce.number().min(0).max(1_000_000).default(0),
  internationalShippingEnabled: z.boolean().default(false),
});

export type CommerceSettings = z.infer<typeof commerceSettingsSchema>;

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  gstPercent: 3,
  freeShippingThreshold: 500,
  shippingFee: 50,
  codEnabled: true,
  razorpayEnabled: true,
  productApprovalRequired: true,
  reviewModeration: true,
  returnWindowDays: 7,
  maxCodOrderAmount: 0,
  internationalShippingEnabled: false,
};

export const integrationsSettingsSchema = z.object({
  phoneOtpEnabled: z.boolean().default(false),
  guestWishlistEnabled: z.boolean().default(true),
  giftNotesEnabled: z.boolean().default(true),
  certificateEnabled: z.boolean().default(true),
  analyticsExportEnabled: z.boolean().default(true),
  /** auto = try MSG91 then Twilio then console in non-prod */
  smsProvider: z
    .enum(["auto", "msg91", "twilio", "console", "off"])
    .default("auto"),
  msg91AuthKey: z.string().max(200).optional().default(""),
  msg91SenderId: z.string().max(12).optional().default("VIDYORA"),
  msg91TemplateId: z.string().max(80).optional().default(""),
  twilioAccountSid: z.string().max(80).optional().default(""),
  twilioAuthToken: z.string().max(80).optional().default(""),
  twilioFromNumber: z.string().max(24).optional().default(""),
  /** Allow OTP 000000 when true (testing only) */
  otpDevBypass: z.boolean().default(false),
  shiprocketEnabled: z.boolean().default(false),
  shiprocketEmail: z.string().max(200).optional().default(""),
  shiprocketPassword: z.string().max(200).optional().default(""),
});

export type IntegrationsSettings = z.infer<typeof integrationsSettingsSchema>;

export const DEFAULT_INTEGRATIONS_SETTINGS: IntegrationsSettings = {
  phoneOtpEnabled: false,
  guestWishlistEnabled: true,
  giftNotesEnabled: true,
  certificateEnabled: true,
  analyticsExportEnabled: true,
  smsProvider: "auto",
  msg91AuthKey: "",
  msg91SenderId: "VIDYORA",
  msg91TemplateId: "",
  twilioAccountSid: "",
  twilioAuthToken: "",
  twilioFromNumber: "",
  otpDevBypass: false,
  shiprocketEnabled: false,
  shiprocketEmail: "",
  shiprocketPassword: "",
};

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
  business: z
    .object({
      legalName: z.string().min(2).max(120),
      gstin: z.string().max(20).optional().default(""),
      pan: z.string().max(20).optional().default(""),
      addressLine1: z.string().max(200).optional().default(""),
      addressLine2: z.string().max(200).optional().default(""),
      city: z.string().max(80).optional().default(""),
      state: z.string().max(80).optional().default(""),
      postalCode: z.string().max(12).optional().default(""),
      originState: z.string().max(80).optional().default(""),
    })
    .optional(),
  commerce: commerceSettingsSchema.optional().default(DEFAULT_COMMERCE_SETTINGS),
  integrations: integrationsSettingsSchema
    .optional()
    .default(DEFAULT_INTEGRATIONS_SETTINGS),
});

export type SiteSettingsData = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_BUSINESS_SETTINGS = {
  legalName: "VIDYORA",
  gstin: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Uttar Pradesh",
  postalCode: "",
  originState: "Uttar Pradesh",
};

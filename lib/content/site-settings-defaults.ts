import type { SiteSettingsData } from "@/lib/validations/site-settings";
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_COMMERCE_SETTINGS,
  DEFAULT_INTEGRATIONS_SETTINGS,
} from "@/lib/validations/site-settings";

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  version: 1,
  contact: {
    supportEmail: "support@vidyora.co.in",
    supportPhone: "+91 94114 41937",
    whatsappNumber: "919411441937",
  },
  social: {
    instagram: "https://www.instagram.com/vidyora_official/",
    facebook: "",
    twitter: "",
    youtube: "",
  },
  business: { ...DEFAULT_BUSINESS_SETTINGS },
  commerce: { ...DEFAULT_COMMERCE_SETTINGS },
  integrations: { ...DEFAULT_INTEGRATIONS_SETTINGS },
};

/** tel: href from a display phone string. */
export function phoneTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return "tel:";
  return cleaned.startsWith("+") ? `tel:${cleaned}` : `tel:+${cleaned}`;
}

/** WhatsApp chat URL from digits-only country+number. */
export function whatsappHref(whatsappNumber: string): string {
  const digits = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

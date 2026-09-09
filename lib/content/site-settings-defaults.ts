import type { SiteSettingsData } from "@/lib/validations/site-settings";

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  version: 1,
  contact: {
    supportEmail: "support@vidyora.co.in",
    supportPhone: "+91 94114 41937",
    whatsappNumber: "919411441937",
  },
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
  },
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

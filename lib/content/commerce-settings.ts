import { getSiteSettings } from "@/lib/content/get-site-settings";
import {
  DEFAULT_COMMERCE_SETTINGS,
  type CommerceSettings,
} from "@/lib/validations/site-settings";

export async function getCommerceSettings(): Promise<CommerceSettings> {
  try {
    const settings = await getSiteSettings();
    return {
      ...DEFAULT_COMMERCE_SETTINGS,
      ...(settings.commerce ?? {}),
    };
  } catch {
    return { ...DEFAULT_COMMERCE_SETTINGS };
  }
}

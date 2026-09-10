import { getSiteSettings } from "@/lib/content/get-site-settings";
import {
  DEFAULT_INTEGRATIONS_SETTINGS,
  type IntegrationsSettings,
} from "@/lib/validations/site-settings";

export async function getIntegrationsSettings(): Promise<IntegrationsSettings> {
  try {
    const settings = await getSiteSettings();
    return {
      ...DEFAULT_INTEGRATIONS_SETTINGS,
      ...(settings.integrations ?? {}),
    };
  } catch {
    return { ...DEFAULT_INTEGRATIONS_SETTINGS };
  }
}

/** Effective SMS/Shiprocket config: Website Settings first, then env fallback. */
export async function resolveSmsRuntimeConfig() {
  const integrations = await getIntegrationsSettings();
  return {
    provider: integrations.smsProvider,
    phoneOtpEnabled: integrations.phoneOtpEnabled,
    otpDevBypass:
      integrations.otpDevBypass || process.env.OTP_DEV_BYPASS === "1",
    msg91AuthKey:
      integrations.msg91AuthKey?.trim() ||
      process.env.MSG91_AUTH_KEY?.trim() ||
      "",
    msg91SenderId:
      integrations.msg91SenderId?.trim() ||
      process.env.MSG91_SENDER_ID?.trim() ||
      "VIDYORA",
    msg91TemplateId:
      integrations.msg91TemplateId?.trim() ||
      process.env.MSG91_TEMPLATE_ID?.trim() ||
      "",
    twilioAccountSid:
      integrations.twilioAccountSid?.trim() ||
      process.env.TWILIO_ACCOUNT_SID?.trim() ||
      "",
    twilioAuthToken:
      integrations.twilioAuthToken?.trim() ||
      process.env.TWILIO_AUTH_TOKEN?.trim() ||
      "",
    twilioFromNumber:
      integrations.twilioFromNumber?.trim() ||
      process.env.TWILIO_FROM_NUMBER?.trim() ||
      "",
  };
}

export async function resolveShiprocketRuntimeConfig() {
  const integrations = await getIntegrationsSettings();
  const email =
    integrations.shiprocketEmail?.trim() ||
    process.env.SHIPROCKET_EMAIL?.trim() ||
    "";
  const password =
    integrations.shiprocketPassword?.trim() ||
    process.env.SHIPROCKET_PASSWORD?.trim() ||
    "";
  return {
    enabled: integrations.shiprocketEnabled && Boolean(email && password),
    email,
    password,
  };
}

import crypto from "crypto";
import { resolveSmsRuntimeConfig } from "@/lib/content/integrations-settings";

/** Normalize Indian mobile to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]/.test(digits)) {
    return `+${digits}`;
  }
  if (
    digits.length === 11 &&
    digits.startsWith("0") &&
    /^0[6-9]/.test(digits)
  ) {
    return `+91${digits.slice(1)}`;
  }
  return null;
}

export function phoneLocalDigits(e164: string): string {
  return e164.replace(/^\+91/, "");
}

/** Synthetic email for phone-only accounts (Auth.js requires email). */
export function phoneAccountEmail(e164: string): string {
  const local = phoneLocalDigits(e164);
  return `phone.${local}@users.vidyora.local`;
}

export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export type SmsSendResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

type SmsConfig = Awaited<ReturnType<typeof resolveSmsRuntimeConfig>>;

async function sendViaMsg91(
  toE164: string,
  message: string,
  config: SmsConfig,
): Promise<SmsSendResult> {
  const msg91Key = config.msg91AuthKey;
  if (!msg91Key) {
    return { ok: false, provider: "msg91", error: "MSG91 auth key missing" };
  }
  const msg91Sender = config.msg91SenderId || "VIDYORA";
  const msg91Template = config.msg91TemplateId;
  const mobile = toE164.replace(/^\+/, "");

  try {
    if (msg91Template) {
      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: msg91Key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: msg91Template,
          recipients: [{ mobiles: mobile, VAR1: message }],
          sender: msg91Sender,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        return { ok: false, provider: "msg91", error: text.slice(0, 200) };
      }
      return { ok: true, provider: "msg91" };
    }

    const smsUrl = `https://api.msg91.com/api/sendhttp.php?authkey=${encodeURIComponent(msg91Key)}&mobiles=${encodeURIComponent(mobile)}&message=${encodeURIComponent(message)}&sender=${encodeURIComponent(msg91Sender)}&route=4&country=91`;
    const response = await fetch(smsUrl);
    if (!response.ok) {
      return { ok: false, provider: "msg91", error: `HTTP ${response.status}` };
    }
    return { ok: true, provider: "msg91" };
  } catch (error) {
    return {
      ok: false,
      provider: "msg91",
      error: error instanceof Error ? error.message : "MSG91 failed",
    };
  }
}

async function sendViaTwilio(
  toE164: string,
  message: string,
  config: SmsConfig,
): Promise<SmsSendResult> {
  const twilioSid = config.twilioAccountSid;
  const twilioToken = config.twilioAuthToken;
  const twilioFrom = config.twilioFromNumber;
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { ok: false, provider: "twilio", error: "Twilio credentials missing" };
  }
  try {
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const body = new URLSearchParams({
      To: toE164,
      From: twilioFrom,
      Body: message,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!response.ok) {
      const text = await response.text();
      return { ok: false, provider: "twilio", error: text.slice(0, 200) };
    }
    return { ok: true, provider: "twilio" };
  } catch (error) {
    return {
      ok: false,
      provider: "twilio",
      error: error instanceof Error ? error.message : "Twilio failed",
    };
  }
}

/**
 * Send SMS via Website Settings / env (MSG91, Twilio, or console).
 */
export async function sendSms(
  toE164: string,
  message: string,
): Promise<SmsSendResult> {
  const config = await resolveSmsRuntimeConfig();

  if (config.provider === "off") {
    return {
      ok: false,
      provider: "off",
      error: "SMS is turned off in Website Settings.",
    };
  }

  if (config.provider === "msg91") {
    return sendViaMsg91(toE164, message, config);
  }
  if (config.provider === "twilio") {
    return sendViaTwilio(toE164, message, config);
  }
  if (config.provider === "console") {
    console.info(`[sms:console] to=${toE164} message=${message}`);
    return { ok: true, provider: "console" };
  }

  // auto
  if (config.msg91AuthKey) {
    const result = await sendViaMsg91(toE164, message, config);
    if (result.ok) return result;
  }
  if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber) {
    const result = await sendViaTwilio(toE164, message, config);
    if (result.ok) return result;
  }
  if (process.env.NODE_ENV !== "production" || process.env.SMS_CONSOLE === "1") {
    console.info(`[sms:console] to=${toE164} message=${message}`);
    return { ok: true, provider: "console" };
  }

  return {
    ok: false,
    provider: "none",
    error:
      "SMS is not configured. Add MSG91 or Twilio under Admin → Website Settings → Integrations.",
  };
}

export async function isSmsConfigured() {
  const config = await resolveSmsRuntimeConfig();
  if (config.provider === "off") return false;
  if (config.provider === "console") return true;
  if (config.provider === "msg91") return Boolean(config.msg91AuthKey);
  if (config.provider === "twilio") {
    return Boolean(
      config.twilioAccountSid &&
        config.twilioAuthToken &&
        config.twilioFromNumber,
    );
  }
  return Boolean(
    config.msg91AuthKey ||
      (config.twilioAccountSid &&
        config.twilioAuthToken &&
        config.twilioFromNumber) ||
      process.env.NODE_ENV !== "production" ||
      process.env.SMS_CONSOLE === "1",
  );
}

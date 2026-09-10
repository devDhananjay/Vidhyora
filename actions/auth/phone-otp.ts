"use server";

import { auth, signIn } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  generateOtpCode,
  hashOtp,
  isSmsConfigured,
  normalizeIndianPhone,
  sendSms,
} from "@/lib/sms/send-sms";
import {
  getRequestIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";
import type { ActionResult } from "@/lib/utils";

const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * TODO(sms): flip to false (and restore login page phoneOtpEnabled) when
 * MSG91/Twilio is configured for production.
 */
const PHONE_OTP_TEMPORARILY_DISABLED = true;

export async function sendPhoneOtp(
  phone: string,
): Promise<ActionResult<{ sent: true; devHint?: string }>> {
  if (PHONE_OTP_TEMPORARILY_DISABLED) {
    return {
      success: false,
      error: "Phone OTP login is temporarily disabled.",
    };
  }

  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`otp-send:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const e164 = normalizeIndianPhone(phone);
    if (!e164) {
      return {
        success: false,
        error: "Enter a valid 10-digit Indian mobile number",
      };
    }

    if (!(await isSmsConfigured())) {
      return {
        success: false,
        error:
          "SMS is not configured yet. Super Admin can add MSG91/Twilio under Website Settings → Integrations.",
      };
    }

    const { getIntegrationsSettings } = await import(
      "@/lib/content/integrations-settings"
    );
    const integrations = await getIntegrationsSettings();
    if (!integrations.phoneOtpEnabled) {
      return {
        success: false,
        error: "Phone OTP login is disabled in Website Settings.",
      };
    }

    const phoneLimited = rateLimit(`otp-send-phone:${e164}`, 3, 15 * 60_000);
    if (!phoneLimited.ok) {
      return {
        success: false,
        error: rateLimitMessage(phoneLimited.retryAfterSec),
      };
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.phoneOtpChallenge.create({
      data: {
        phone: e164,
        codeHash: hashOtp(code),
        expiresAt,
      },
    });

    const message = `VIDYORA login OTP: ${code}. Valid for 10 minutes. Do not share.`;
    const sms = await sendSms(e164, message);
    if (!sms.ok) {
      return {
        success: false,
        error: sms.error || "Failed to send OTP. Try again later.",
      };
    }

    return {
      success: true,
      data: {
        sent: true,
        ...(sms.provider === "console"
          ? { devHint: "OTP printed to server logs (dev / SMS_CONSOLE)." }
          : {}),
      },
    };
  } catch (error) {
    console.error("sendPhoneOtp error:", error);
    return { success: false, error: "Failed to send OTP" };
  }
}

export async function verifyPhoneOtpAndSignIn(
  phone: string,
  otp: string,
): Promise<ActionResult<{ role: string }>> {
  if (PHONE_OTP_TEMPORARILY_DISABLED) {
    return {
      success: false,
      error: "Phone OTP login is temporarily disabled.",
    };
  }

  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`otp-verify:${ip}`, 15, 60_000);
    if (!limited.ok) {
      return { success: false, error: rateLimitMessage(limited.retryAfterSec) };
    }

    const e164 = normalizeIndianPhone(phone);
    const code = String(otp ?? "").trim();
    if (!e164) {
      return { success: false, error: "Enter a valid phone number" };
    }
    if (!/^\d{4,8}$/.test(code)) {
      return { success: false, error: "Enter the OTP you received" };
    }

    const result = await signIn("phone-otp", {
      phone: e164,
      otp: code,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      return {
        success: false,
        error: "Incorrect or expired OTP. Request a new one.",
      };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Incorrect or expired OTP. Request a new one.",
      };
    }

    try {
      const { mergeGuestCartIntoUser } = await import(
        "@/lib/cart/cart-session"
      );
      await mergeGuestCartIntoUser(session.user.id);
    } catch (mergeError) {
      console.error("Guest cart merge failed:", mergeError);
    }
    try {
      const { mergeGuestWishlistIntoUser } = await import(
        "@/lib/wishlist/wishlist-session"
      );
      await mergeGuestWishlistIntoUser(session.user.id);
    } catch (mergeError) {
      console.error("Guest wishlist merge failed:", mergeError);
    }

    return {
      success: true,
      data: { role: session.user.role || "CUSTOMER" },
    };
  } catch (error) {
    console.error("verifyPhoneOtpAndSignIn error:", error);
    return {
      success: false,
      error: "Incorrect or expired OTP. Request a new one.",
    };
  }
}

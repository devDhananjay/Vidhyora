"use server";

import prisma from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import { generatePasswordResetToken } from "@/lib/auth/tokens";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";
import {
  getRequestIp,
  rateLimit,
  rateLimitMessage,
} from "@/lib/security/rate-limit";

export async function forgotPasswordAction(
  data: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const ip = await getRequestIp();
    const limited = rateLimit(`forgot-password:${ip}`, 5, 60_000);
    if (!limited.ok) {
      return actionError(rateLimitMessage(limited.retryAfterSec));
    }

    const validated = forgotPasswordSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!user) {
      return actionSuccess({
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const token = await generatePasswordResetToken(user.email);
    await sendPasswordResetEmail(user.email, user.name || "User", token);

    return actionSuccess({
      message:
        "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return actionError("Please check your input and try again");
    }

    return actionError("Failed to process request. Please try again.");
  }
}

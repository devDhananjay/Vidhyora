"use server";

import prisma from "@/lib/prisma";
import { verifyVerificationToken } from "@/lib/auth/tokens";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";

export async function verifyEmailAction(
  token: string,
): Promise<ActionResult<{ message: string }>> {
  try {
    if (!token) {
      return actionError("Verification token is required");
    }

    const email = await verifyVerificationToken(token);

    if (!email) {
      return actionError("Invalid or expired verification token");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return actionError("User not found");
    }

    if (user.emailVerified) {
      return actionError("Email already verified");
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    return actionSuccess({
      message: "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    return actionError("Failed to verify email. Please try again.");
  }
}

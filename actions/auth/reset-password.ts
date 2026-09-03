"use server";

import prisma from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { verifyPasswordResetToken } from "@/lib/auth/tokens";

export async function resetPasswordAction(
  data: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const validated = resetPasswordSchema.parse(data);

    const email = await verifyPasswordResetToken(validated.token);

    if (!email) {
      return actionError("Invalid or expired reset token");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return actionError("User not found");
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    return actionSuccess({
      message: "Password reset successfully! You can now sign in.",
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return actionError("Please check your input and try again");
    }

    return actionError("Failed to reset password. Please try again.");
  }
}

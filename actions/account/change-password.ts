"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { changePasswordSchema } from "@/lib/validations/account";
import type { ActionResult } from "@/lib/utils";

export async function changePassword(
  raw: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return { success: false, error: "Account not found" };
    }

    const hasExistingPassword = Boolean(user.passwordHash);
    const parsed = changePasswordSchema.safeParse({
      ...((raw && typeof raw === "object" ? raw : {}) as object),
      hasExistingPassword,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid password details",
      };
    }

    if (hasExistingPassword && user.passwordHash) {
      const valid = await bcrypt.compare(
        parsed.data.currentPassword || "",
        user.passwordHash,
      );
      if (!valid) {
        return { success: false, error: "Current password is incorrect" };
      }
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    revalidatePath("/account");

    return {
      success: true,
      data: {
        message: hasExistingPassword
          ? "Password updated successfully"
          : "Password set successfully",
      },
    };
  } catch (error) {
    console.error("changePassword error:", error);
    return { success: false, error: "Failed to change password" };
  }
}

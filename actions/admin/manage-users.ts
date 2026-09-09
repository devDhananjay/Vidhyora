"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { isSuperAdmin } from "@/lib/roles";
import {
  adminResetUserPasswordSchema,
  adminUpdateUserProfileSchema,
  adminUpdateUserRoleSchema,
} from "@/lib/validations/admin-user";
import type { ActionResult } from "@/lib/utils";

function revalidateUser(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/sellers");
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.id === session.user.id) {
      return { success: false, error: "You cannot deactivate your own account" };
    }

    if (isSuperAdmin(user.role)) {
      return {
        success: false,
        error: "Super Admin accounts cannot be deactivated here",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    revalidateUser(userId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Set user active error:", error);
    return { success: false, error: "Failed to update account status" };
  }
}

export async function updateUserProfile(
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ name: string; email: string; phone: string | null }>> {
  try {
    await requireAdmin();
    const parsed = adminUpdateUserProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid profile details",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    const phone = parsed.data.phone.trim() ? parsed.data.phone.trim() : null;

    const emailTaken = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        NOT: { id: userId },
      },
      select: { id: true },
    });
    if (emailTaken) {
      return { success: false, error: "This email is already in use" };
    }

    if (phone) {
      const phoneTaken = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: userId },
        },
        select: { id: true },
      });
      if (phoneTaken) {
        return { success: false, error: "This phone number is already in use" };
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone,
      },
      select: { name: true, email: true, phone: true },
    });

    revalidateUser(userId);
    return {
      success: true,
      data: {
        name: updated.name ?? parsed.data.name,
        email: updated.email,
        phone: updated.phone,
      },
    };
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateUserRole(
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ role: UserRole }>> {
  try {
    const session = await requireAdmin();
    const parsed = adminUpdateUserRoleSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid role",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.id === session.user.id) {
      return { success: false, error: "You cannot change your own role" };
    }

    // Only a Super Admin session can assign/remove platform admin roles
    if (
      (parsed.data.role === "ADMIN" ||
        parsed.data.role === "SUPER_ADMIN" ||
        isSuperAdmin(user.role)) &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return {
        success: false,
        error: "Only Super Admin can change platform admin roles",
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: parsed.data.role },
      select: { role: true },
    });

    revalidateUser(userId);
    return { success: true, data: { role: updated.role } };
  } catch (error) {
    console.error("updateUserRole error:", error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function adminResetUserPassword(
  userId: string,
  raw: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const session = await requireAdmin();
    const parsed = adminResetUserPasswordSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid password",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });
    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.id === session.user.id) {
      return {
        success: false,
        error: "Use Account Settings to change your own password",
      };
    }

    if (isSuperAdmin(user.role) && session.user.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Only Super Admin can reset another admin password",
      };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidateUser(userId);
    return {
      success: true,
      data: { message: `Password updated for ${user.email}` },
    };
  } catch (error) {
    console.error("adminResetUserPassword error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

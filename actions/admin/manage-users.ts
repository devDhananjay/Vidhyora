"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { isSuperAdmin } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
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

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/sellers");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Set user active error:", error);
    return { success: false, error: "Failed to update account status" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { updateProfileSchema } from "@/lib/validations/account";
import type { ActionResult } from "@/lib/utils";

export async function updateProfile(
  raw: unknown,
): Promise<ActionResult<{ name: string; phone: string | null }>> {
  try {
    const session = await requireAuth();
    const parsed = updateProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid profile details",
      };
    }

    const phone =
      parsed.data.phone && parsed.data.phone.trim()
        ? parsed.data.phone.trim()
        : null;

    if (phone) {
      const taken = await prisma.user.findFirst({
        where: {
          phone,
          NOT: { id: session.user.id },
        },
        select: { id: true },
      });
      if (taken) {
        return { success: false, error: "This phone number is already in use" };
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        phone,
      },
      select: { name: true, phone: true },
    });

    revalidatePath("/account");

    return {
      success: true,
      data: { name: user.name ?? parsed.data.name, phone: user.phone },
    };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

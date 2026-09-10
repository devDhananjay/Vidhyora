"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";

export type NotificationPreferenceValues = {
  orderUpdates: boolean;
  promotions: boolean;
  priceDrops: boolean;
  productBackInStock: boolean;
};

const DEFAULT_PREFS: NotificationPreferenceValues = {
  orderUpdates: true,
  promotions: true,
  priceDrops: true,
  productBackInStock: false,
};

const saveSchema = z.object({
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  priceDrops: z.boolean(),
  productBackInStock: z.boolean(),
});

export async function getNotificationPreferences(): Promise<NotificationPreferenceValues> {
  try {
    const session = await requireAuth();
    const row = await prisma.userNotificationPreference.findUnique({
      where: { userId: session.user.id },
    });
    if (!row) return { ...DEFAULT_PREFS };
    return {
      orderUpdates: row.orderUpdates,
      promotions: row.promotions,
      priceDrops: row.priceDrops,
      productBackInStock: row.productBackInStock,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function saveNotificationPreferences(
  raw: unknown,
): Promise<ActionResult<NotificationPreferenceValues>> {
  try {
    const session = await requireAuth();
    const parsed = saveSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid preferences",
      };
    }

    const row = await prisma.userNotificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...parsed.data,
      },
      update: parsed.data,
    });

    revalidatePath("/account");

    return {
      success: true,
      data: {
        orderUpdates: row.orderUpdates,
        promotions: row.promotions,
        priceDrops: row.priceDrops,
        productBackInStock: row.productBackInStock,
      },
    };
  } catch (error) {
    console.error("saveNotificationPreferences error:", error);
    return { success: false, error: "Failed to save notification preferences" };
  }
}

/** Returns false only when a prefs row exists and orderUpdates is explicitly off. */
export async function userAllowsOrderEmails(userId: string): Promise<boolean> {
  const prefs = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: { orderUpdates: true },
  });
  if (!prefs) return true;
  return prefs.orderUpdates !== false;
}

export async function userAllowsPromotionEmails(userId: string): Promise<boolean> {
  const prefs = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: { promotions: true },
  });
  if (!prefs) return true;
  return prefs.promotions !== false;
}

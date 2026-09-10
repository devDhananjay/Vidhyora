"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import type { ActionResult } from "@/lib/utils";

const sellerSettingsSchema = z.object({
  businessPhone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone")
    .max(20),
  notifyNewOrders: z.boolean(),
  notifyLowStock: z.boolean(),
  preferredCourier: z.string().trim().max(80),
  processingDays: z.number().int().min(1).max(14),
  bankAccountHolder: z.string().trim().max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{9,18}$/.test(v), "Invalid account number"),
  bankIfscCode: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v),
      "Invalid IFSC",
    ),
  bankName: z.string().trim().max(80),
});

export async function updateSellerSettings(
  raw: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }
    if (acting.isAdminView) {
      return {
        success: false,
        error: "Update settings from the seller login",
      };
    }

    const parsed = sellerSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid settings",
      };
    }

    await prisma.sellerProfile.update({
      where: { sellerId: acting.sellerUserId },
      data: {
        businessPhone: parsed.data.businessPhone,
        notifyNewOrders: parsed.data.notifyNewOrders,
        notifyLowStock: parsed.data.notifyLowStock,
        preferredCourier: parsed.data.preferredCourier || null,
        processingDays: parsed.data.processingDays,
        bankAccountHolder: parsed.data.bankAccountHolder || null,
        bankAccountNumber: parsed.data.bankAccountNumber || null,
        bankIfscCode: parsed.data.bankIfscCode || null,
        bankName: parsed.data.bankName || null,
      },
    });

    revalidatePath("/seller/settings");
    revalidatePath("/seller/profile");

    return { success: true, data: { message: "Settings saved" } };
  } catch (error) {
    console.error("updateSellerSettings error:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

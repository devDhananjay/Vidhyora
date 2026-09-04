"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { couponSchema, type CouponInput } from "@/lib/validations/coupon";
import type { ActionResult } from "@/lib/utils";

export async function createCoupon(
  data: CouponInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const validated = couponSchema.parse(data);

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return {
        success: false,
        error: "A coupon with this code already exists",
      };
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: validated.code,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        minimumOrderValue: validated.minimumOrderValue ?? 0,
        maximumDiscount: validated.maximumDiscount ?? null,
        startDate: new Date(validated.startDate),
        expiryDate: new Date(validated.expiryDate),
        usageLimit: validated.usageLimit ?? null,
        perUserLimit: validated.perUserLimit ?? 1,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");

    return {
      success: true,
      data: { id: coupon.id },
    };
  } catch (error) {
    console.error("Create coupon error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon",
    };
  }
}

export async function updateCoupon(
  id: string,
  data: CouponInput,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const validated = couponSchema.parse(data);

    // Check if code is taken by another coupon
    const existing = await prisma.coupon.findUnique({
      where: { code: validated.code },
    });

    if (existing && existing.id !== id) {
      return {
        success: false,
        error: "A coupon with this code already exists",
      };
    }

    await prisma.coupon.update({
      where: { id },
      data: {
        code: validated.code,
        discountType: validated.discountType,
        discountValue: validated.discountValue,
        minimumOrderValue: validated.minimumOrderValue ?? 0,
        maximumDiscount: validated.maximumDiscount ?? null,
        startDate: new Date(validated.startDate),
        expiryDate: new Date(validated.expiryDate),
        usageLimit: validated.usageLimit ?? null,
        perUserLimit: validated.perUserLimit ?? 1,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Update coupon error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update coupon",
    };
  }
}

export async function deleteCoupon(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    await prisma.coupon.delete({
      where: { id },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Delete coupon error:", error);
    return {
      success: false,
      error: "Failed to delete coupon",
    };
  }
}

export async function toggleCouponStatus(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!coupon) {
      return {
        success: false,
        error: "Coupon not found",
      };
    }

    await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    revalidatePath("/admin/coupons");
    revalidatePath("/offers");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Toggle coupon status error:", error);
    return {
      success: false,
      error: "Failed to toggle coupon status",
    };
  }
}

export async function getAllCoupons() {
  try {
    await requireAdmin();

    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return coupons;
  } catch (error) {
    console.error("Get coupons error:", error);
    return [];
  }
}

export async function getCouponById(id: string) {
  try {
    await requireAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    return coupon;
  } catch (error) {
    console.error("Get coupon error:", error);
    return null;
  }
}

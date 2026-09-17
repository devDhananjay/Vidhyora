"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/utils";
import type { ProductAlertType } from "@prisma/client";

const subscribeSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["PRICE_DROP", "BACK_IN_STOCK"]),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  variantId: z.string().optional(),
  baselinePrice: z.number().min(0).optional(),
});

export async function subscribeProductAlert(
  input: z.infer<typeof subscribeSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const data = subscribeSchema.parse(input);
    const session = await auth();
    const email =
      data.email?.trim() ||
      session?.user?.email?.trim() ||
      null;

    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        status: "ACTIVE",
        approvalStatus: "APPROVED",
      },
      select: {
        id: true,
        basePrice: true,
        variants: {
          where: { isActive: true },
          select: { id: true, price: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const variantId = data.variantId || product.variants[0]?.id || null;
    const baseline =
      data.baselinePrice ??
      (product.variants[0] ? Number(product.variants[0].price) : Number(product.basePrice));

    const existing = await prisma.productAlert.findFirst({
      where: {
        productId: data.productId,
        type: data.type as ProductAlertType,
        phone: data.phone,
        active: true,
      },
    });

    if (existing) {
      const updated = await prisma.productAlert.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          email,
          userId: session?.user?.id || existing.userId,
          variantId,
          baselinePrice: baseline,
          notifiedAt: null,
        },
      });
      return { success: true, data: { id: updated.id } };
    }

    const created = await prisma.productAlert.create({
      data: {
        productId: data.productId,
        type: data.type as ProductAlertType,
        name: data.name,
        phone: data.phone,
        email,
        userId: session?.user?.id || null,
        variantId,
        baselinePrice: baseline,
      },
    });

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Subscribe product alert error:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid alert details",
      };
    }
    return { success: false, error: "Failed to save alert" };
  }
}

export async function unsubscribeProductAlert(input: {
  productId: string;
  type: "PRICE_DROP" | "BACK_IN_STOCK";
  phone?: string;
}): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    const phone = input.phone?.replace(/\D/g, "");

    await prisma.productAlert.updateMany({
      where: {
        productId: input.productId,
        type: input.type,
        active: true,
        OR: [
          ...(session?.user?.id ? [{ userId: session.user.id }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      data: { active: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unsubscribe product alert error:", error);
    return { success: false, error: "Failed to turn off alert" };
  }
}

export async function hasActiveProductAlert(input: {
  productId: string;
  type: "PRICE_DROP" | "BACK_IN_STOCK";
  phone?: string;
}): Promise<boolean> {
  try {
    const session = await auth();
    const phone = input.phone?.replace(/\D/g, "");
    if (!session?.user?.id && !phone) return false;

    const row = await prisma.productAlert.findFirst({
      where: {
        productId: input.productId,
        type: input.type,
        active: true,
        OR: [
          ...(session?.user?.id ? [{ userId: session.user.id }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
      select: { id: true },
    });
    return Boolean(row);
  } catch {
    return false;
  }
}

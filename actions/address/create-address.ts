"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { addressSchema } from "@/lib/validations/address";
import type { ActionResult } from "@/lib/utils";

export async function createAddress(
  formData: FormData,
): Promise<ActionResult<{ addressId: string }>> {
  try {
    const session = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: String(formData.get("addressLine2") || ""),
      city: formData.get("city"),
      state: formData.get("state"),
      country: formData.get("country") || "IN",
      postalCode: formData.get("postalCode"),
      landmark: String(formData.get("landmark") || ""),
      type: (formData.get("type") as "SHIPPING" | "BILLING" | "BOTH") || "SHIPPING",
      label: (formData.get("label") as "HOME" | "WORK" | "OTHER") || "HOME",
      isDefault: formData.get("isDefault") === "true",
    };

    const parsed = addressSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid address details",
      };
    }
    const validatedData = parsed.data;

    // If this is default address, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    revalidatePath("/account");
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: { addressId: address.id },
    };
  } catch (error) {
    console.error("Create address error:", error);
    return {
      success: false,
      error: "Failed to create address",
    };
  }
}

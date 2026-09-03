"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { addressSchema } from "@/lib/validations/address";
import type { ActionResult } from "@/lib/utils";

export async function updateAddress(
  addressId: string,
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    const rawData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
      country: formData.get("country") || "IN",
      postalCode: formData.get("postalCode"),
      landmark: formData.get("landmark") || undefined,
      type: (formData.get("type") as "SHIPPING" | "BILLING" | "BOTH") || "SHIPPING",
      isDefault: formData.get("isDefault") === "true",
    };

    const validatedData = addressSchema.parse(rawData);

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    // If this is default address, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      });
    }

    await prisma.address.update({
      where: { id: addressId },
      data: validatedData,
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Update address error:", error);
    return {
      success: false,
      error: "Failed to update address",
    };
  }
}

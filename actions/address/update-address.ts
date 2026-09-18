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

    const latRaw = formData.get("latitude");
    const lngRaw = formData.get("longitude");
    const latNum =
      latRaw != null && String(latRaw).trim() !== ""
        ? Number(latRaw)
        : null;
    const lngNum =
      lngRaw != null && String(lngRaw).trim() !== ""
        ? Number(lngRaw)
        : null;

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
      latitude: Number.isFinite(latNum) ? latNum : null,
      longitude: Number.isFinite(lngNum) ? lngNum : null,
    };

    const parsed = addressSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid address details",
      };
    }
    const validatedData = parsed.data;

    let latitude = validatedData.latitude ?? null;
    let longitude = validatedData.longitude ?? null;
    if (latitude == null || longitude == null) {
      try {
        const { geocodeFullAddress } = await import("@/lib/google/maps");
        const place = await geocodeFullAddress({
          line1: validatedData.addressLine1,
          line2: validatedData.addressLine2,
          city: validatedData.city,
          state: validatedData.state,
          postalCode: validatedData.postalCode,
        });
        if (place?.lat != null && place?.lng != null) {
          latitude = place.lat;
          longitude = place.lng;
        }
      } catch {
        // optional
      }
    }

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

    const { latitude: _lat, longitude: _lng, ...rest } = validatedData;

    await prisma.address.update({
      where: { id: addressId },
      data: {
        ...rest,
        latitude,
        longitude,
      },
    });

    revalidatePath("/account");
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

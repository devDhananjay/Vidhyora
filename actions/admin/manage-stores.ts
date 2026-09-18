"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  storeLocationSchema,
  type StoreLocationInput,
} from "@/lib/validations/content";
import type { ActionResult } from "@/lib/utils";

function revalidateStores() {
  revalidatePath("/store-locator");
  revalidatePath("/admin/stores");
}

export async function getAdminStores() {
  await requireAdmin();
  return prisma.storeLocation.findMany({
    orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
  });
}

export async function createStore(
  data: StoreLocationInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = storeLocationSchema.parse(data);
    const coords = await resolveStoreCoords(validated);

    const store = await prisma.storeLocation.create({
      data: {
        ...validated,
        email: validated.email || null,
        postalCode: validated.postalCode || null,
        mapUrl: validated.mapUrl || coords.mapUrl || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    revalidateStores();
    return { success: true, data: { id: store.id } };
  } catch (error) {
    console.error("Create store error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create store",
    };
  }
}

export async function updateStore(
  id: string,
  data: StoreLocationInput,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = storeLocationSchema.parse(data);
    const coords = await resolveStoreCoords(validated);

    await prisma.storeLocation.update({
      where: { id },
      data: {
        ...validated,
        email: validated.email || null,
        postalCode: validated.postalCode || null,
        mapUrl: validated.mapUrl || coords.mapUrl || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    revalidateStores();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update store error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update store",
    };
  }
}

async function resolveStoreCoords(store: StoreLocationInput) {
  try {
    const { geocodeFullAddress } = await import("@/lib/google/maps");
    const place = await geocodeFullAddress({
      line1: store.address,
      city: store.city,
      state: store.state,
      postalCode: store.postalCode || undefined,
    });
    if (place?.lat != null && place?.lng != null) {
      return {
        latitude: place.lat,
        longitude: place.lng,
        mapUrl: `https://www.google.com/maps?q=${place.lat},${place.lng}`,
      };
    }
  } catch {
    // optional
  }
  return { latitude: null as number | null, longitude: null as number | null, mapUrl: null as string | null };
}

export async function toggleStoreStatus(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const store = await prisma.storeLocation.findUnique({ where: { id } });
    if (!store) return { success: false, error: "Store not found" };

    await prisma.storeLocation.update({
      where: { id },
      data: { isActive: !store.isActive },
    });

    revalidateStores();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Toggle store error:", error);
    return { success: false, error: "Failed to update store" };
  }
}

export async function deleteStore(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.storeLocation.delete({ where: { id } });
    revalidateStores();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete store error:", error);
    return { success: false, error: "Failed to delete store" };
  }
}

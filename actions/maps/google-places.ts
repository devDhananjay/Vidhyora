"use server";

import {
  estimateDeliveryByPincode,
  geocodeIndianCity,
  geocodeIndianPincode,
  type DeliveryMatrixResult,
  type GeocodePlace,
} from "@/lib/google/maps";
import type { ActionResult } from "@/lib/utils";

export async function lookupAddressByPincode(
  pincode: string,
): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await geocodeIndianPincode(pincode);
    if (!place || (!place.city && !place.state)) {
      return {
        success: false,
        error: "Could not find city for this PIN code",
      };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("lookupAddressByPincode error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to look up PIN code",
    };
  }
}

export async function lookupAddressByCity(
  city: string,
): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await geocodeIndianCity(city);
    if (!place) {
      return { success: false, error: "Could not find this city" };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("lookupAddressByCity error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to look up city",
    };
  }
}

export async function checkDeliveryEstimate(
  pincode: string,
): Promise<ActionResult<DeliveryMatrixResult>> {
  try {
    const estimate = await estimateDeliveryByPincode(pincode);
    return { success: true, data: estimate };
  } catch (error) {
    console.error("checkDeliveryEstimate error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to estimate delivery",
    };
  }
}

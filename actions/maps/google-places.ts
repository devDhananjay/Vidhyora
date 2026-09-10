"use server";

import {
  estimateDeliveryByPincode,
  geocodeIndianCity,
  geocodeIndianPincode,
  geocodeSearchQuery,
  reverseGeocodeLatLng,
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

export async function lookupAddressByCoords(
  lat: number,
  lng: number,
): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await reverseGeocodeLatLng(lat, lng);
    if (!place) {
      return { success: false, error: "Could not find this location" };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("lookupAddressByCoords error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to look up location",
    };
  }
}

export async function searchLocation(
  query: string,
): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await geocodeSearchQuery(query);
    if (!place) {
      return { success: false, error: "No results for this search" };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("searchLocation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search location",
    };
  }
}

export async function checkDeliveryEstimate(
  pincode: string,
  options?: { sellerProcessingDays?: number },
): Promise<ActionResult<DeliveryMatrixResult>> {
  try {
    const estimate = await estimateDeliveryByPincode(pincode, {
      processingDays: options?.sellerProcessingDays,
    });
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

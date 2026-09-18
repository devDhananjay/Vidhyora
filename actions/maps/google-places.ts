"use server";

import {
  distanceKmBetweenPins,
  estimateDeliveryByPincode,
  geocodeFullAddress,
  geocodeIndianCity,
  geocodeIndianPincode,
  geocodeSearchQuery,
  getIndianPlaceDetails,
  isGoogleMapsConfigured,
  reverseGeocodeLatLng,
  suggestIndianPlaces,
  type DeliveryMatrixResult,
  type GeocodePlace,
  type PlaceSuggestion,
} from "@/lib/google/maps";
import type { ActionResult } from "@/lib/utils";

export async function mapsStatus(): Promise<{ configured: boolean }> {
  return { configured: isGoogleMapsConfigured() };
}

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

export async function suggestAddresses(
  query: string,
  sessionToken?: string,
): Promise<ActionResult<PlaceSuggestion[]>> {
  try {
    if (!isGoogleMapsConfigured()) {
      return { success: true, data: [] };
    }
    const suggestions = await suggestIndianPlaces(query, sessionToken);
    return { success: true, data: suggestions };
  } catch (error) {
    console.error("suggestAddresses error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to suggest addresses",
    };
  }
}

export async function resolvePlaceDetails(
  placeId: string,
  sessionToken?: string,
): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await getIndianPlaceDetails(placeId, sessionToken);
    if (!place) {
      return { success: false, error: "Could not resolve this place" };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("resolvePlaceDetails error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to resolve place details",
    };
  }
}

export async function checkDeliveryEstimate(
  pincode: string,
  options?: { sellerProcessingDays?: number; originPincode?: string },
): Promise<ActionResult<DeliveryMatrixResult>> {
  try {
    const estimate = await estimateDeliveryByPincode(pincode, {
      processingDays: options?.sellerProcessingDays,
      originPincode: options?.originPincode,
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

export async function getShippingDistanceKm(
  destinationPincode: string,
  originPincode?: string,
): Promise<ActionResult<{ distanceKm: number | null }>> {
  try {
    const dest = destinationPincode.replace(/\D/g, "");
    if (!/^\d{6}$/.test(dest)) {
      return { success: false, error: "Invalid destination PIN" };
    }
    const origin =
      originPincode?.replace(/\D/g, "") ||
      process.env.GOOGLE_DELIVERY_ORIGIN_PIN?.replace(/\D/g, "") ||
      "110001";
    const distanceKm = await distanceKmBetweenPins(origin, dest);
    return { success: true, data: { distanceKm } };
  } catch (error) {
    console.error("getShippingDistanceKm error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to calculate distance",
    };
  }
}

export async function geocodeAddressLines(input: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}): Promise<ActionResult<GeocodePlace>> {
  try {
    const place = await geocodeFullAddress(input);
    if (!place) {
      return { success: false, error: "Could not geocode this address" };
    }
    return { success: true, data: place };
  } catch (error) {
    console.error("geocodeAddressLines error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to geocode address",
    };
  }
}

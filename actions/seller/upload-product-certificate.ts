"use server";

import { uploadFile } from "@/lib/storage";
import { getActingSeller } from "@/lib/seller-context";
import type { ActionResult } from "@/lib/utils";

const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadProductCertificate(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a certificate file" };
    }

    const uploaded = await uploadFile(file, {
      maxSize: MAX_BYTES,
      allowedTypes: [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ],
      folder: `uploads/products/${acting.sellerUserId}/certificates`,
    });

    return { success: true, data: { url: uploaded.url } };
  } catch (error) {
    console.error("Upload product certificate error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload certificate",
    };
  }
}

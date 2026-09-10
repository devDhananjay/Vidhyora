"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/storage";
import type { ActionResult } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadKycDocument(
  formData: FormData,
): Promise<ActionResult<void>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }
    if (acting.isAdminView) {
      return {
        success: false,
        error: "Seller admin must upload KYC from their own login",
      };
    }

    const kind = formData.get("kind");
    const file = formData.get("file");
    if (kind !== "gst" && kind !== "pan") {
      return { success: false, error: "Choose GST or PAN document" };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a file" };
    }

    const uploaded = await uploadFile(file, {
      maxSize: MAX_BYTES,
      allowedTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ],
      folder: `uploads/kyc/${acting.sellerUserId}`,
    });
    const url = uploaded.url;

    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId: acting.sellerUserId },
      select: {
        gstNumber: true,
        panNumber: true,
        kycGstDocumentUrl: true,
        kycPanDocumentUrl: true,
        kycStatus: true,
      },
    });
    if (!profile) {
      return { success: false, error: "Seller profile not found" };
    }

    const nextGstUrl = kind === "gst" ? url : profile.kycGstDocumentUrl;
    const nextPanUrl = kind === "pan" ? url : profile.kycPanDocumentUrl;
    const readyToReview =
      Boolean(nextGstUrl) &&
      Boolean(nextPanUrl) &&
      Boolean(profile.gstNumber) &&
      Boolean(profile.panNumber);

    await prisma.sellerProfile.update({
      where: { sellerId: acting.sellerUserId },
      data: {
        ...(kind === "gst"
          ? { kycGstDocumentUrl: url }
          : { kycPanDocumentUrl: url }),
        ...(profile.kycStatus === "VERIFIED"
          ? {}
          : readyToReview
            ? {
                kycStatus: "PENDING" as const,
                kycRejectionReason: null,
                kycSubmittedAt: new Date(),
              }
            : {
                kycStatus: "NOT_SUBMITTED" as const,
                kycRejectionReason: null,
              }),
      },
    });

    revalidatePath("/seller/profile");
    revalidatePath("/seller/kyc");
    revalidatePath("/seller/settings");
    revalidatePath(`/admin/sellers/${acting.sellerUserId}`);
    revalidatePath("/admin/sellers");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Upload KYC error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

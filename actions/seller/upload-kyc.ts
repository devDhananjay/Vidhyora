"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

function extensionFor(file: File) {
  return ALLOWED.get(file.type) ?? null;
}

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
    if (file.size > MAX_BYTES) {
      return { success: false, error: "File must be 5 MB or smaller" };
    }
    const ext = extensionFor(file);
    if (!ext) {
      return { success: false, error: "Upload a JPG, PNG, WEBP or PDF" };
    }

    const dir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "kyc",
      acting.sellerUserId,
    );
    await mkdir(dir, { recursive: true });
    const filename = `${kind}-${Date.now()}.${ext}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    const url = `/uploads/kyc/${acting.sellerUserId}/${filename}`;

    await prisma.sellerProfile.update({
      where: { sellerId: acting.sellerUserId },
      data: {
        ...(kind === "gst"
          ? { kycGstDocumentUrl: url }
          : { kycPanDocumentUrl: url }),
        kycStatus: "PENDING",
        kycRejectionReason: null,
        kycSubmittedAt: new Date(),
      },
    });

    revalidatePath("/seller/profile");
    revalidatePath("/seller/settings");
    revalidatePath(`/admin/sellers/${acting.sellerUserId}`);
    revalidatePath("/admin/sellers");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Upload KYC error:", error);
    return { success: false, error: "Failed to upload document" };
  }
}

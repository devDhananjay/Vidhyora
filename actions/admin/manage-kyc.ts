"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function verifySellerKyc(
  sellerId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId },
      select: { kycGstDocumentUrl: true, kycPanDocumentUrl: true },
    });
    if (!profile) {
      return { success: false, error: "Seller not found" };
    }
    if (!profile.kycGstDocumentUrl || !profile.kycPanDocumentUrl) {
      return {
        success: false,
        error: "GST and PAN documents are required before verify",
      };
    }

    await prisma.sellerProfile.update({
      where: { sellerId },
      data: {
        kycStatus: "VERIFIED",
        kycRejectionReason: null,
      },
    });

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Verify KYC error:", error);
    return { success: false, error: "Failed to verify KYC" };
  }
}

export async function rejectSellerKyc(
  sellerId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const note = reason.trim();
    if (!note) {
      return { success: false, error: "Please provide a rejection reason" };
    }

    await prisma.sellerProfile.update({
      where: { sellerId },
      data: {
        kycStatus: "REJECTED",
        kycRejectionReason: note,
      },
    });

    revalidatePath("/admin/sellers");
    revalidatePath(`/admin/sellers/${sellerId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Reject KYC error:", error);
    return { success: false, error: "Failed to reject KYC" };
  }
}

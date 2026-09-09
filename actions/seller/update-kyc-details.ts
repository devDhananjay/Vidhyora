"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import type { ActionResult } from "@/lib/utils";

const kycDetailsSchema = z.object({
  gstNumber: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value),
      "Enter a valid GST number",
    ),
  panNumber: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value),
      "Enter a valid PAN number",
    ),
  bankAccountHolder: z.string().trim().max(80),
  bankAccountNumber: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\d{9,18}$/.test(value),
      "Enter a valid bank account number",
    ),
  bankIfscCode: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value),
      "Enter a valid IFSC code",
    ),
  bankName: z.string().trim().max(80),
});

export async function updateSellerKycDetails(
  raw: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }
    if (acting.isAdminView) {
      return {
        success: false,
        error: "Seller admin must update KYC from their own login",
      };
    }

    const parsed = kycDetailsSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid KYC details",
      };
    }

    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId: acting.sellerUserId },
      select: {
        kycGstDocumentUrl: true,
        kycPanDocumentUrl: true,
        kycStatus: true,
      },
    });
    if (!profile) {
      return { success: false, error: "Seller profile not found" };
    }

    const bothDocs =
      Boolean(profile.kycGstDocumentUrl) && Boolean(profile.kycPanDocumentUrl);

    await prisma.sellerProfile.update({
      where: { sellerId: acting.sellerUserId },
      data: {
        gstNumber: parsed.data.gstNumber || null,
        panNumber: parsed.data.panNumber || null,
        bankAccountHolder: parsed.data.bankAccountHolder || null,
        bankAccountNumber: parsed.data.bankAccountNumber || null,
        bankIfscCode: parsed.data.bankIfscCode || null,
        bankName: parsed.data.bankName || null,
        ...(bothDocs && profile.kycStatus !== "VERIFIED"
          ? {
              kycStatus: "PENDING" as const,
              kycSubmittedAt: new Date(),
              kycRejectionReason: null,
            }
          : {}),
      },
    });

    revalidatePath("/seller/profile");
    revalidatePath("/seller/kyc");
    revalidatePath(`/admin/sellers/${acting.sellerUserId}`);

    return { success: true, data: { message: "KYC details saved" } };
  } catch (error) {
    console.error("updateSellerKycDetails error:", error);
    return { success: false, error: "Failed to save KYC details" };
  }
}

export async function submitSellerKycForReview(): Promise<
  ActionResult<{ message: string }>
> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }
    if (acting.isAdminView) {
      return {
        success: false,
        error: "Seller admin must submit KYC from their own login",
      };
    }

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
    if (profile.kycStatus === "VERIFIED") {
      return { success: false, error: "KYC is already verified" };
    }
    if (!profile.gstNumber || !profile.panNumber) {
      return {
        success: false,
        error: "Add GST and PAN numbers before submitting",
      };
    }
    if (!profile.kycGstDocumentUrl || !profile.kycPanDocumentUrl) {
      return {
        success: false,
        error: "Upload GST and PAN documents before submitting",
      };
    }

    await prisma.sellerProfile.update({
      where: { sellerId: acting.sellerUserId },
      data: {
        kycStatus: "PENDING",
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
    });

    revalidatePath("/seller/profile");
    revalidatePath("/seller/kyc");
    revalidatePath(`/admin/sellers/${acting.sellerUserId}`);
    revalidatePath("/admin/sellers");

    return {
      success: true,
      data: { message: "KYC submitted for Super Admin review" },
    };
  } catch (error) {
    console.error("submitSellerKycForReview error:", error);
    return { success: false, error: "Failed to submit KYC" };
  }
}

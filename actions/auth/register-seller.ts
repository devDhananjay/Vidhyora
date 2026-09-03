"use server";

import prisma from "@/lib/prisma";
import { sellerRegistrationSchema } from "@/lib/validations/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email/send-verification";
import { generateVerificationToken } from "@/lib/auth/tokens";

export async function registerSellerAction(
  data: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const validated = sellerRegistrationSchema.parse(data);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email.toLowerCase() },
          { phone: validated.phone },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === validated.email.toLowerCase()) {
        return actionError("Email already registered");
      }
      return actionError("Phone number already registered");
    }

    const existingBusinessEmail = await prisma.sellerProfile.findFirst({
      where: { businessEmail: validated.businessEmail.toLowerCase() },
    });

    if (existingBusinessEmail) {
      return actionError("Business email already registered");
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.businessName,
        email: validated.email.toLowerCase(),
        phone: validated.phone,
        passwordHash,
        role: "SELLER",
        sellerProfile: {
          create: {
            businessName: validated.businessName,
            businessEmail: validated.businessEmail.toLowerCase(),
            businessPhone: validated.businessPhone,
            gstNumber: validated.gstNumber,
            panNumber: validated.panNumber,
            businessAddress: {
              line1: validated.address,
              city: validated.city,
              state: validated.state,
              country: "IN",
              postalCode: validated.postalCode,
            },
            verificationStatus: "PENDING",
            kycStatus: "NOT_SUBMITTED",
          },
        },
      },
    });

    const token = await generateVerificationToken(user.email);
    await sendVerificationEmail(
      user.email,
      validated.businessName,
      token,
    );

    return actionSuccess({
      message:
        "Seller account created successfully! Please check your email to verify your account. Your account will be reviewed by our team.",
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return actionError("Please check your input and try again");
    }

    return actionError("Failed to create seller account. Please try again.");
  }
}

"use server";

import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email/send-verification";
import { generateVerificationToken } from "@/lib/auth/tokens";

export async function registerAction(
  data: unknown,
): Promise<ActionResult<{ message: string }>> {
  try {
    const validated = registerSchema.parse(data);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email.toLowerCase() },
          ...(validated.phone ? [{ phone: validated.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === validated.email.toLowerCase()) {
        return actionError("Email already registered");
      }
      return actionError("Phone number already registered");
    }

    const passwordHash = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        phone: validated.phone,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    const token = await generateVerificationToken(user.email);
    await sendVerificationEmail(user.email, user.name || "User", token);

    return actionSuccess({
      message:
        "Account created successfully! Please check your email to verify your account.",
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return actionError("Please check your input and try again");
    }

    return actionError("Failed to create account. Please try again.");
  }
}

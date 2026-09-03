"use server";

import { signIn, auth } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import prisma from "@/lib/prisma";

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function getAuthErrorType(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 5 && current; i += 1) {
    if (typeof current !== "object" || current === null) break;
    if ("type" in current && typeof current.type === "string") {
      return current.type;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}

export async function loginAction(
  data: unknown,
): Promise<ActionResult<{ success: boolean; role?: string }>> {
  try {
    const validated = loginSchema.parse(data);
    const email = validated.email.toLowerCase();

    try {
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true },
      });

      if (existing && existing.isActive === false) {
        return actionError(
          "This account is inactive. Contact Super Admin to restore access.",
        );
      }
    } catch (lookupError) {
      console.error("Login account status check failed:", lookupError);
    }

    await signIn("credentials", {
      email,
      password: validated.password,
      redirect: false,
    });

    const session = await auth();

    return actionSuccess({
      success: true,
      role: session?.user.role,
    });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    const type = getAuthErrorType(error);
    if (type === "CredentialsSignin") {
      return actionError("Invalid email or password");
    }
    if (type) {
      return actionError("Authentication failed. Please try again.");
    }

    if (error instanceof Error && "issues" in error) {
      return actionError("Please check your input and try again");
    }

    console.error("Login error:", error);
    return actionError("An unexpected error occurred");
  }
}

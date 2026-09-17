import prisma from "@/lib/prisma";

/**
 * Find or create a lightweight customer account for guest checkout.
 * Passwordless — they can set a password later via forgot-password / OTP.
 */
export async function ensureGuestCheckoutUser(input: {
  email: string;
  name: string;
  phone: string;
}) {
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim().replace(/\s+/g, "");

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
    },
  });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || input.name.trim(),
        phone: existing.phone || phone || null,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name: input.name.trim(),
      phone: phone || null,
      role: "CUSTOMER",
      isActive: true,
    },
  });
}

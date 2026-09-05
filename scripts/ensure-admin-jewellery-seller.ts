/**
 * Ensure admin@vidyora.co.in is SUPER_ADMIN with an approved jewellery seller profile.
 * Usage: DATABASE_URL=... npx tsx scripts/ensure-admin-jewellery-seller.ts
 */
import {
  KycStatus,
  PrismaClient,
  SellerVerificationStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const EMAIL = "admin@vidyora.co.in";
const PASSWORD = "Password@123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      name: "VIDYORA Super Admin",
      emailVerified: new Date(),
    },
    create: {
      email: EMAIL,
      name: "VIDYORA Super Admin",
      phone: "+919876543210",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  // If account already existed without password, set one
  if (!user.passwordHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
  }

  await prisma.sellerProfile.upsert({
    where: { sellerId: user.id },
    update: {
      businessName: "VIDYORA Jewellery",
      businessEmail: EMAIL,
      businessPhone: "+919876543210",
      gstNumber: "27AABCV1234J1Z9",
      panNumber: "AABCV1234J",
      businessAddress: {
        line1: "12 Zaveri Bazaar",
        city: "Mumbai",
        state: "Maharashtra",
        country: "IN",
        postalCode: "400002",
      },
      kycStatus: KycStatus.VERIFIED,
      verificationStatus: SellerVerificationStatus.APPROVED,
      commissionPercentage: 0,
      bankAccountHolder: "VIDYORA Jewellery",
      bankAccountNumber: "50100999887766",
      bankIfscCode: "HDFC0001822",
      bankName: "HDFC Bank",
    },
    create: {
      sellerId: user.id,
      businessName: "VIDYORA Jewellery",
      businessEmail: EMAIL,
      businessPhone: "+919876543210",
      gstNumber: "27AABCV1234J1Z9",
      panNumber: "AABCV1234J",
      businessAddress: {
        line1: "12 Zaveri Bazaar",
        city: "Mumbai",
        state: "Maharashtra",
        country: "IN",
        postalCode: "400002",
      },
      kycStatus: KycStatus.VERIFIED,
      verificationStatus: SellerVerificationStatus.APPROVED,
      commissionPercentage: 0,
      bankAccountHolder: "VIDYORA Jewellery",
      bankAccountNumber: "50100999887766",
      bankIfscCode: "HDFC0001822",
      bankName: "HDFC Bank",
    },
  });

  console.log("OK", {
    email: EMAIL,
    role: "SUPER_ADMIN",
    seller: "VIDYORA Jewellery (APPROVED)",
    passwordHint: user.passwordHash ? "existing password kept (or set if empty)" : PASSWORD,
    defaultPasswordIfNew: PASSWORD,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

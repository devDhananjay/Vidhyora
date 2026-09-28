/**
 * Force-rename Super Admin login from admin@* → support@vidyora.co.in.
 * Handles conflict if support@ already exists.
 *
 * Usage: npx tsx scripts/migrate-admin-to-support.ts
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const TARGET = "support@vidyora.co.in";
const LEGACY = ["admin@vidyora.co.in", "admin@vidyora.com"] as const;

async function main() {
  const legacyUsers = await prisma.user.findMany({
    where: { email: { in: [...LEGACY] } },
    include: { sellerProfile: true },
  });
  const target = await prisma.user.findUnique({
    where: { email: TARGET },
    include: { sellerProfile: true },
  });

  console.log(
    "Before:",
    [...legacyUsers, ...(target ? [target] : [])].map((u) => ({
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      id: u.id,
    })),
  );

  // Prefer the real production admin@vidyora.co.in account as keeper.
  const candidates = [...legacyUsers, ...(target ? [target] : [])];
  const byEmail = new Map(candidates.map((u) => [u.email, u]));
  const keeper =
    byEmail.get("admin@vidyora.co.in") ??
    byEmail.get("admin@vidyora.com") ??
    byEmail.get(TARGET) ??
    candidates.find((u) => u.role === UserRole.SUPER_ADMIN) ??
    candidates[0];

  if (!keeper) {
    console.log("No admin users found to migrate.");
    return;
  }

  // If keeper is not already support@, rename it (after clearing conflict).
  if (keeper.email !== TARGET) {
    if (target && target.id !== keeper.id) {
      // Park conflicting support@ account so we can take the email.
      const parked = `support+parked-${Date.now()}@vidyora.co.in`;
      await prisma.user.update({
        where: { id: target.id },
        data: {
          email: parked,
          isActive: false,
        },
      });
      console.log(`Parked conflicting ${TARGET} → ${parked}`);
    }

    await prisma.user.update({
      where: { id: keeper.id },
      data: {
        email: TARGET,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        name: "VIDYORA Super Admin",
        emailVerified: new Date(),
      },
    });
    console.log(`Renamed ${keeper.email} → ${TARGET}`);
  } else {
    await prisma.user.update({
      where: { id: keeper.id },
      data: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        name: "VIDYORA Super Admin",
        emailVerified: new Date(),
      },
    });
    console.log(`${TARGET} already on keeper — ensured SUPER_ADMIN`);
  }

  // Sync seller business email if profile exists.
  const seller = await prisma.sellerProfile.findUnique({
    where: { sellerId: keeper.id },
  });
  if (seller && seller.businessEmail !== TARGET) {
    await prisma.sellerProfile.update({
      where: { sellerId: keeper.id },
      data: { businessEmail: TARGET },
    });
    console.log(`Updated seller businessEmail → ${TARGET}`);
  }

  // Deactivate leftover legacy admin emails.
  for (const email of LEGACY) {
    const leftover = await prisma.user.findUnique({ where: { email } });
    if (leftover && leftover.id !== keeper.id) {
      await prisma.user.update({
        where: { id: leftover.id },
        data: { isActive: false },
      });
      console.log(`Deactivated leftover ${email}`);
    }
  }

  // If admin@vidyora.co.in still exists as the keeper was support and admin remains,
  // merge by renaming admin onto support was done above. If admin still exists because
  // keeper was already support, rename that admin user away from public listing by
  // changing email + deactivate — OR if it's the same person duplicate, deactivate.
  for (const email of LEGACY) {
    const still = await prisma.user.findUnique({ where: { email } });
    if (still) {
      // Shouldn't happen if we renamed keeper from this email; defend anyway.
      const parked = `admin+legacy-${Date.now()}@vidyora.co.in`;
      await prisma.user.update({
        where: { id: still.id },
        data: { email: parked, isActive: false },
      });
      console.log(`Parked leftover ${email} → ${parked}`);
    }
  }

  const after = await prisma.user.findMany({
    where: {
      OR: [
        { email: TARGET },
        { email: { in: [...LEGACY] } },
        { email: { contains: "admin+legacy-" } },
        { email: { contains: "support+parked-" } },
      ],
    },
    select: {
      email: true,
      role: true,
      isActive: true,
      sellerProfile: { select: { businessEmail: true } },
    },
  });
  console.log("After:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

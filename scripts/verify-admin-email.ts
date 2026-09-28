import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const emails = [
  "support@vidyora.co.in",
  "admin@vidyora.co.in",
  "admin@vidyora.com",
];

async function main() {
  const rows = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: {
      email: true,
      role: true,
      isActive: true,
      sellerProfile: {
        select: { businessEmail: true, verificationStatus: true },
      },
    },
  });
  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

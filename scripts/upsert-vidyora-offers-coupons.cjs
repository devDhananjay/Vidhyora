/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { PrismaClient, DiscountType } = require("@prisma/client");

const prisma = new PrismaClient();
const START = new Date("2026-10-01T00:00:00+05:30");
const EXPIRY = new Date("2027-03-31T23:59:59+05:30");

const ACTIVE = [
  {
    code: "FIRST499",
    description: "First order: ₹50 off on ₹499+",
    discountType: DiscountType.FIXED,
    discountValue: 50,
    minimumOrderValue: 499,
    maximumDiscount: 50,
    usageLimit: 500,
    perUserLimit: 1,
  },
  {
    code: "FIRST999",
    description: "First order: ₹100 off on ₹999+",
    discountType: DiscountType.FIXED,
    discountValue: 100,
    minimumOrderValue: 999,
    maximumDiscount: 100,
    usageLimit: 300,
    perUserLimit: 1,
  },
  {
    code: "FIRST2K",
    description: "First order: ₹200 off when you shop ₹1,999+",
    discountType: DiscountType.FIXED,
    discountValue: 200,
    minimumOrderValue: 1999,
    maximumDiscount: 200,
    usageLimit: 200,
    perUserLimit: 1,
  },
  {
    code: "FESTIVE10",
    description: "Festive: 10% off (max ₹100) on ₹499+",
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minimumOrderValue: 499,
    maximumDiscount: 100,
    usageLimit: 500,
    perUserLimit: 1,
  },
];

const DEACTIVATE = ["FESTIVE20", "GOLD500", "WELCOME10", "VIDYORA10"];

async function main() {
  for (const c of ACTIVE) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minimumOrderValue: c.minimumOrderValue,
        maximumDiscount: c.maximumDiscount,
        startDate: START,
        expiryDate: EXPIRY,
        usageLimit: c.usageLimit,
        perUserLimit: c.perUserLimit,
        isActive: true,
      },
      update: {
        description: c.description,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minimumOrderValue: c.minimumOrderValue,
        maximumDiscount: c.maximumDiscount,
        startDate: START,
        expiryDate: EXPIRY,
        usageLimit: c.usageLimit,
        perUserLimit: c.perUserLimit,
        isActive: true,
      },
    });
    console.log("upserted", c.code);
  }

  for (const code of DEACTIVATE) {
    const res = await prisma.coupon.updateMany({
      where: { code },
      data: { isActive: false },
    });
    if (res.count) console.log("deactivated", code);
  }

  const live = await prisma.coupon.findMany({
    where: { isActive: true },
    select: {
      code: true,
      discountValue: true,
      minimumOrderValue: true,
      maximumDiscount: true,
      usageLimit: true,
      usageCount: true,
      perUserLimit: true,
      isActive: true,
    },
    orderBy: { code: "asc" },
  });
  console.log(JSON.stringify({ live }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Password@123";

function splitSale(gross: number, rate = 10) {
  const commissionAmount = Math.round(((gross * rate) / 100) * 100) / 100;
  const netAmount = Math.round((gross - commissionAmount) * 100) / 100;
  return { commissionAmount, netAmount, rate };
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function ensurePaidOrder(options: {
  orderNumber: string;
  sellerId: string;
  customerId: string;
  product: {
    id: string;
    name: string;
    variants: Array<{ id: string; sku: string; price: unknown }>;
  };
  address: Record<string, string>;
  daysOld: number;
  trackingNumber: string;
}) {
  const existing = await prisma.order.findUnique({
    where: { orderNumber: options.orderNumber },
    include: { items: true },
  });
  if (existing) return existing;

  const variant = options.product.variants[0];
  const price = Number(variant.price);
  const tax = Math.round(price * 0.03);
  const createdAt = daysAgo(options.daysOld);

  return prisma.order.create({
    data: {
      orderNumber: options.orderNumber,
      userId: options.customerId,
      subtotal: price,
      discount: 0,
      shippingFee: 0,
      tax,
      total: price + tax,
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
      shippingAddress: options.address,
      billingAddress: options.address,
      createdAt,
      items: {
        create: {
          productId: options.product.id,
          variantId: variant.id,
          sellerId: options.sellerId,
          quantity: 1,
          price,
          tax,
          total: price,
          productName: options.product.name,
          sku: variant.sku,
          variantLabel: "Standard",
        },
      },
      payments: {
        create: {
          provider: "RAZORPAY",
          transactionId: `txn_${options.orderNumber.toLowerCase()}`,
          amount: price + tax,
          currency: "INR",
          status: "CAPTURED",
        },
      },
      shipments: {
        create: {
          sellerId: options.sellerId,
          trackingNumber: options.trackingNumber,
          courier: "Bluedart",
          shippedAt: daysAgo(options.daysOld - 2),
          deliveredAt: daysAgo(options.daysOld - 4),
        },
      },
    },
    include: { items: true },
  });
}

async function seedPaymentDemo(options: {
  sellerId: string;
  profileId: string;
  businessName: string;
  customerId: string;
  products: Array<{
    id: string;
    name: string;
    variants: Array<{ id: string; sku: string; price: unknown }>;
  }>;
  address: Record<string, string>;
}) {
  await prisma.sellerProfile.update({
    where: { id: options.profileId },
    data: {
      bankAccountHolder: options.businessName,
      bankAccountNumber: "50100123456789",
      bankIfscCode: "HDFC0001822",
      bankName: "HDFC Bank",
    },
  });

  const extraProducts = options.products.filter((product) => product.variants[0]);
  if (extraProducts[1]) {
    await ensurePaidOrder({
      orderNumber: "VDY-PAY-001",
      sellerId: options.sellerId,
      customerId: options.customerId,
      product: extraProducts[1],
      address: options.address,
      daysOld: 22,
      trackingNumber: "VDYPAY001",
    });
  }
  if (extraProducts[4] ?? extraProducts[2]) {
    await ensurePaidOrder({
      orderNumber: "VDY-PAY-002",
      sellerId: options.sellerId,
      customerId: options.customerId,
      product: extraProducts[4] ?? extraProducts[2],
      address: options.address,
      daysOld: 9,
      trackingNumber: "VDYPAY002",
    });
  }

  const items = await prisma.orderItem.findMany({
    where: {
      sellerId: options.sellerId,
      order: { paymentStatus: "PAID" },
      earning: { is: null },
    },
    include: {
      order: { select: { id: true, orderNumber: true } },
    },
  });

  for (const item of items) {
    const gross = Number(item.total);
    const { commissionAmount, netAmount, rate } = splitSale(gross);
    await prisma.sellerEarning.create({
      data: {
        sellerId: options.sellerId,
        orderId: item.order.id,
        orderItemId: item.id,
        orderNumber: item.order.orderNumber,
        productName: item.productName,
        grossAmount: gross,
        commissionRate: rate,
        commissionAmount,
        netAmount,
        status: "AVAILABLE",
      },
    });
  }

  const payoutCount = await prisma.sellerPayout.count({
    where: { sellerId: options.sellerId },
  });
  if (payoutCount > 0) {
    console.log("⏭️  Seller payouts already exist");
    return;
  }

  const available = await prisma.sellerEarning.findMany({
    where: { sellerId: options.sellerId, status: "AVAILABLE" },
    orderBy: { createdAt: "asc" },
  });

  const batches = [available.slice(0, 1), available.slice(1, 2)].filter(
    (batch) => batch.length > 0,
  );

  const notes = [
    "NEFT to HDFC · Aug settlement",
    "IMPS to HDFC · weekly payout",
  ];
  const ages = [21, 8];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const gross = batch.reduce((sum, row) => sum + Number(row.grossAmount), 0);
    const commission = batch.reduce(
      (sum, row) => sum + Number(row.commissionAmount),
      0,
    );
    const amount = batch.reduce((sum, row) => sum + Number(row.netAmount), 0);
    const paidAt = daysAgo(ages[index] ?? 7);

    const payout = await prisma.sellerPayout.create({
      data: {
        sellerId: options.sellerId,
        gross,
        commission,
        amount,
        status: "PAID",
        note: notes[index],
        paidAt,
        createdAt: paidAt,
      },
    });

    await prisma.sellerEarning.updateMany({
      where: { id: { in: batch.map((row) => row.id) } },
      data: {
        status: "INCLUDED",
        payoutId: payout.id,
      },
    });
  }

  console.log("✅ Seeded dummy payments, earnings, and payouts");
}

async function main() {
  console.log("🌱 Seeding seller dashboard demo data...");
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const ownedProduct = await prisma.product.findFirst({
    orderBy: { createdAt: "asc" },
    select: { sellerId: true },
  });

  let seller = ownedProduct
    ? await prisma.user.findUnique({
        where: { id: ownedProduct.sellerId },
        include: { sellerProfile: true },
      })
    : null;

  if (!seller) {
    seller = await prisma.user.findUnique({
      where: { email: "jewelry@vidyora.com" },
      include: { sellerProfile: true },
    });
  }

  if (!seller?.sellerProfile) {
    throw new Error("No seller found. Run jewelry/product seed first.");
  }

  await prisma.user.update({
    where: { id: seller.id },
    data: { passwordHash },
  });

  await prisma.sellerProfile.update({
    where: { id: seller.sellerProfile.id },
    data: {
      bankAccountHolder: seller.sellerProfile.bankAccountHolder || seller.sellerProfile.businessName,
      bankAccountNumber: seller.sellerProfile.bankAccountNumber || "123456789012",
      bankIfscCode: seller.sellerProfile.bankIfscCode || "SBIN0001234",
      bankName: seller.sellerProfile.bankName || "State Bank of India",
      kycStatus: "VERIFIED",
      verificationStatus: "APPROVED",
    },
  });

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { variants: { take: 1, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  if (products.length === 0) {
    throw new Error("Seller has no products.");
  }

  const withVariants = products.filter((p) => p.variants.length > 0);

  // Low / out of stock for inventory review
  if (withVariants[0]) {
    await prisma.productVariant.update({
      where: { id: withVariants[0].variants[0].id },
      data: { stock: 4 },
    });
  }
  if (withVariants[1]) {
    await prisma.productVariant.update({
      where: { id: withVariants[1].variants[0].id },
      data: { stock: 8 },
    });
  }
  if (withVariants[2]) {
    await prisma.productVariant.update({
      where: { id: withVariants[2].variants[0].id },
      data: { stock: 0 },
    });
  }

  const customer =
    (await prisma.user.findUnique({ where: { email: "customer1@example.com" } })) ??
    (await prisma.user.findFirst({ where: { role: "CUSTOMER" } }));

  if (!customer) {
    throw new Error("No customer found for demo orders.");
  }

  const address = {
    name: customer.name ?? "Rahul Sharma",
    phone: customer.phone ?? "+919100000001",
    addressLine1: "14, MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    postalCode: "400001",
  };

  // Point existing demo order items at this seller
  await prisma.orderItem.updateMany({
    where: {
      order: { orderNumber: { in: ["VDY-DEMO-001", "VDY-DEMO-002"] } },
    },
    data: { sellerId: seller.id },
  });

  const extraNumber = "VDY-SELLER-003";
  const existingExtra = await prisma.order.findUnique({
    where: { orderNumber: extraNumber },
  });

  const source = withVariants[3] ?? withVariants[0];
  if (!existingExtra && source) {
    const price = Number(source.variants[0].price);
    const tax = Math.round(price * 0.03);
    await prisma.order.create({
      data: {
        orderNumber: extraNumber,
        userId: customer.id,
        subtotal: price,
        discount: 0,
        shippingFee: 0,
        tax,
        total: price + tax,
        paymentStatus: "PAID",
        orderStatus: "SHIPPED",
        shippingAddress: address,
        billingAddress: address,
        items: {
          create: {
            productId: source.id,
            variantId: source.variants[0].id,
            sellerId: seller.id,
            quantity: 1,
            price,
            tax,
            total: price,
            productName: source.name,
            sku: source.variants[0].sku,
            variantLabel: "Standard",
          },
        },
        payments: {
          create: {
            provider: "RAZORPAY",
            transactionId: "txn_seller_003",
            amount: price + tax,
            currency: "INR",
            status: "CAPTURED",
          },
        },
        shipments: {
          create: {
            sellerId: seller.id,
            trackingNumber: "VDYTRACK003",
            courier: "Delhivery",
            shippedAt: new Date(),
          },
        },
      },
    });
    console.log("✅ Created extra seller order VDY-SELLER-003");
  }

  const deliveredItem = await prisma.orderItem.findFirst({
    where: {
      sellerId: seller.id,
      order: { orderStatus: "DELIVERED" },
    },
    include: { order: true },
  });

  if (deliveredItem) {
    const existingReturn = await prisma.returnRequest.findFirst({
      where: { orderItemId: deliveredItem.id },
    });
    if (!existingReturn) {
      await prisma.returnRequest.create({
        data: {
          orderItemId: deliveredItem.id,
          userId: deliveredItem.order.userId,
          type: "RETURN",
          reason: "Size / fit not as expected",
          description: "The ring is slightly tight. Requesting a size exchange or refund.",
          status: "PENDING",
        },
      });
      console.log("✅ Created pending return request");
    }
  }

  const secondItem = await prisma.orderItem.findFirst({
    where: {
      sellerId: seller.id,
      id: deliveredItem ? { not: deliveredItem.id } : undefined,
    },
  });

  if (secondItem) {
    const existing = await prisma.returnRequest.findFirst({
      where: { orderItemId: secondItem.id },
    });
    if (!existing) {
      await prisma.returnRequest.create({
        data: {
          orderItemId: secondItem.id,
          userId: customer.id,
          type: "REPLACEMENT",
          reason: "Minor finish issue on clasp",
          description: "Clasp feels loose. Prefer a replacement piece.",
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
      console.log("✅ Created approved replacement request");
    }
  }

  await seedPaymentDemo({
    sellerId: seller.id,
    profileId: seller.sellerProfile.id,
    businessName: seller.sellerProfile.businessName,
    customerId: customer.id,
    products: withVariants,
    address,
  });

  console.log("✅ Seller demo ready");
  console.log(`\n📋 Seller login: ${seller.email} / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seller demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

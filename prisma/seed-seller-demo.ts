import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "Password@123";

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

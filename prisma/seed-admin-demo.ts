import {
  PrismaClient,
  DiscountType,
  KycStatus,
  ProductApprovalStatus,
  ProductStatus,
  SellerVerificationStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_ORDERS = ["VDY-DEMO-001", "VDY-DEMO-002"] as const;

const address = {
  name: "Rahul Sharma",
  phone: "+919100000001",
  addressLine1: "14, MG Road",
  addressLine2: "Near City Centre",
  city: "Mumbai",
  state: "Maharashtra",
  country: "IN",
  postalCode: "400001",
};

async function main() {
  console.log("🌱 Seeding admin review demo data...");

  const passwordHash = await bcrypt.hash("Password@123", 12);

  const customer =
    (await prisma.user.findUnique({ where: { email: "customer1@example.com" } })) ??
    (await prisma.user.create({
      data: {
        email: "customer1@example.com",
        name: "Rahul Sharma",
        phone: "+919100000001",
        passwordHash,
        role: UserRole.CUSTOMER,
        emailVerified: new Date(),
      },
    }));

  const reviewer =
    (await prisma.user.findUnique({ where: { email: "customer2@example.com" } })) ??
    (await prisma.user.create({
      data: {
        email: "customer2@example.com",
        name: "Priya Patel",
        phone: "+919100000002",
        passwordHash,
        role: UserRole.CUSTOMER,
        emailVerified: new Date(),
      },
    }));

  await prisma.user.upsert({
    where: { email: "pending.seller@vidyora.com" },
    update: {},
    create: {
      email: "pending.seller@vidyora.com",
      name: "Meera Jewels",
      phone: "+919000000009",
      passwordHash,
      role: UserRole.SELLER,
      emailVerified: new Date(),
      sellerProfile: {
        create: {
          businessName: "Meera Jewels Pvt Ltd",
          businessEmail: "pending.seller@vidyora.com",
          businessPhone: "+919000000009",
          gstNumber: "27AABMJ1234P1Z8",
          panNumber: "AABMJ1234P",
          businessAddress: {
            line1: "88 Zaveri Bazaar",
            city: "Mumbai",
            state: "Maharashtra",
            country: "IN",
            postalCode: "400002",
          },
          kycStatus: KycStatus.PENDING,
          verificationStatus: SellerVerificationStatus.PENDING,
          commissionPercentage: 10,
        },
      },
    },
  });

  const products = await prisma.product.findMany({
    include: { variants: { take: 1, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  const withVariants = products.filter((p) => p.variants.length > 0);
  if (withVariants.length < 2) {
    throw new Error("Need at least 2 products with variants. Run prisma/seed.ts first.");
  }

  const [productA, productB, productC] = withVariants;

  for (const code of [
    {
      code: "WELCOME10",
      description: "10% off on first order",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minimumOrderValue: 500,
      maximumDiscount: 2000,
    },
    {
      code: "FESTIVE20",
      description: "20% off festive jewellery",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minimumOrderValue: 10000,
      maximumDiscount: 15000,
    },
    {
      code: "GOLD500",
      description: "₹500 off on gold jewellery",
      discountType: DiscountType.FIXED,
      discountValue: 500,
      minimumOrderValue: 5000,
      maximumDiscount: 500,
    },
  ] as const) {
    await prisma.coupon.upsert({
      where: { code: code.code },
      update: { isActive: true },
      create: {
        ...code,
        startDate: new Date("2025-01-01"),
        expiryDate: new Date("2027-12-31"),
        usageLimit: 500,
        perUserLimit: 1,
        isActive: true,
      },
    });
  }

  const pendingSlugs = ["diamond-solitaire-ring", "gold-chain-necklace"];
  await prisma.product.updateMany({
    where: { slug: { in: pendingSlugs } },
    data: {
      approvalStatus: ProductApprovalStatus.PENDING_APPROVAL,
      status: ProductStatus.DRAFT,
    },
  });

  if (
    !(await prisma.product.count({
      where: { approvalStatus: ProductApprovalStatus.PENDING_APPROVAL },
    }))
  ) {
    await prisma.product.update({
      where: { id: withVariants[withVariants.length - 1].id },
      data: {
        approvalStatus: ProductApprovalStatus.PENDING_APPROVAL,
        status: ProductStatus.DRAFT,
      },
    });
  }

  const existingDemo = await prisma.order.findMany({
    where: { orderNumber: { in: [...DEMO_ORDERS] } },
    select: { orderNumber: true },
  });
  const existingNumbers = new Set(existingDemo.map((o) => o.orderNumber));

  if (!existingNumbers.has("VDY-DEMO-001")) {
    const priceA = Number(productA.variants[0].price);
    const priceB = Number(productB.variants[0].price);
    const subtotal = priceA + priceB;
    const tax = Math.round(subtotal * 0.03);
    const total = subtotal + tax;

    const order = await prisma.order.create({
      data: {
        orderNumber: "VDY-DEMO-001",
        userId: customer.id,
        subtotal,
        discount: 0,
        shippingFee: 0,
        tax,
        total,
        paymentStatus: "PAID",
        orderStatus: "DELIVERED",
        shippingAddress: address,
        billingAddress: address,
        couponCode: "WELCOME10",
        notes: "Please gift wrap the necklace.",
        items: {
          create: [
            {
              productId: productA.id,
              variantId: productA.variants[0].id,
              sellerId: productA.sellerId,
              quantity: 1,
              price: priceA,
              tax: Math.round(priceA * 0.03),
              total: priceA,
              productName: productA.name,
              sku: productA.variants[0].sku,
              variantLabel: "Standard",
            },
            {
              productId: productB.id,
              variantId: productB.variants[0].id,
              sellerId: productB.sellerId,
              quantity: 1,
              price: priceB,
              tax: Math.round(priceB * 0.03),
              total: priceB,
              productName: productB.name,
              sku: productB.variants[0].sku,
              variantLabel: "Standard",
            },
          ],
        },
        payments: {
          create: {
            provider: "RAZORPAY",
            providerPaymentId: "pay_demo_captured_001",
            transactionId: "txn_demo_001",
            amount: total,
            currency: "INR",
            status: "CAPTURED",
          },
        },
        shipments: {
          create: {
            sellerId: productA.sellerId,
            trackingNumber: "VDYTRACK001",
            courier: "Bluedart",
            shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            estimatedDeliveryDate: new Date(),
          },
        },
        statusHistory: {
          create: [
            { status: "ORDERED", note: "Order placed" },
            { status: "CONFIRMED", note: "Payment captured" },
            { status: "SHIPPED", note: "Handed to courier" },
            { status: "DELIVERED", note: "Delivered to customer" },
          ],
        },
      },
      include: { items: true },
    });

    if (order.items[0]) {
      await prisma.review.create({
        data: {
          userId: customer.id,
          productId: order.items[0].productId,
          orderItemId: order.items[0].id,
          rating: 5,
          title: "Beautiful piece",
          comment:
            "The finish is excellent and packaging felt premium. Sharing this for the catalogue review.",
          status: "PENDING",
        },
      });
    }

    if (order.items[1]) {
      await prisma.review.create({
        data: {
          userId: reviewer.id,
          productId: order.items[1].productId,
          orderItemId: order.items[1].id,
          rating: 4,
          title: "Good quality, slightly delayed",
          comment: "Loved the design. Delivery took a day extra than promised.",
          status: "PENDING",
        },
      });
    }

    console.log("✅ Created order VDY-DEMO-001 with 2 pending reviews");
  } else {
    console.log("⏭️  Order VDY-DEMO-001 already exists");
  }

  if (!existingNumbers.has("VDY-DEMO-002")) {
    const source = productC ?? productA;
    const price = Number(source.variants[0].price);
    const tax = Math.round(price * 0.03);
    const total = price + tax;

    await prisma.order.create({
      data: {
        orderNumber: "VDY-DEMO-002",
        userId: reviewer.id,
        subtotal: price,
        discount: 500,
        shippingFee: 0,
        tax,
        total: total - 500,
        paymentStatus: "PENDING",
        orderStatus: "CONFIRMED",
        shippingAddress: {
          ...address,
          name: "Priya Patel",
          phone: "+919100000002",
          city: "Ahmedabad",
          state: "Gujarat",
          postalCode: "380001",
        },
        billingAddress: {
          ...address,
          name: "Priya Patel",
          phone: "+919100000002",
        },
        couponCode: "GOLD500",
        notes: "COD order for review.",
        items: {
          create: {
            productId: source.id,
            variantId: source.variants[0].id,
            sellerId: source.sellerId,
            quantity: 1,
            price,
            tax,
            discount: 500,
            total: price - 500,
            productName: source.name,
            sku: source.variants[0].sku,
            variantLabel: "Standard",
          },
        },
        payments: {
          create: {
            provider: "COD",
            transactionId: "cod_demo_002",
            amount: total - 500,
            currency: "INR",
            status: "CREATED",
          },
        },
        statusHistory: {
          create: [
            { status: "ORDERED", note: "COD order placed" },
            { status: "CONFIRMED", note: "Seller confirmed" },
          ],
        },
      },
    });

    console.log("✅ Created order VDY-DEMO-002");
  } else {
    console.log("⏭️  Order VDY-DEMO-002 already exists");
  }

  const deliveredOrder =
    (await prisma.order.findUnique({
      where: { orderNumber: "VDY-DEMO-001" },
      include: { items: true },
    })) ?? null;

  if (deliveredOrder?.items[0]) {
    const existing = await prisma.returnRequest.findFirst({
      where: { orderItemId: deliveredOrder.items[0].id },
    });
    if (!existing) {
      await prisma.returnRequest.create({
        data: {
          orderItemId: deliveredOrder.items[0].id,
          userId: deliveredOrder.userId,
          type: "RETURN",
          reason: "Size / fit not as expected",
          description:
            "The ring sits tight on the finger. Requesting a size exchange or refund.",
          status: "PENDING",
        },
      });
      console.log("✅ Created pending return on VDY-DEMO-001");
    }
  }

  if (deliveredOrder?.items[1]) {
    const existing = await prisma.returnRequest.findFirst({
      where: { orderItemId: deliveredOrder.items[1].id },
    });
    if (!existing) {
      await prisma.returnRequest.create({
        data: {
          orderItemId: deliveredOrder.items[1].id,
          userId: reviewer.id,
          type: "REPLACEMENT",
          reason: "Minor finish issue on clasp",
          description:
            "Clasp feels loose after one day of wear. Prefer a replacement piece.",
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
      console.log("✅ Created approved replacement on VDY-DEMO-001");
    }
  }

  console.log("✅ Admin demo data ready");
}

main()
  .catch((e) => {
    console.error("❌ Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

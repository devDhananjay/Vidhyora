import {
  PrismaClient,
  UserRole,
  ProductApprovalStatus,
  ProductStatus,
  SellerVerificationStatus,
  KycStatus,
  DiscountType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password@123";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding VIDYORA database...");

  const passwordHash = await hashPassword(PASSWORD);

  // ─── Users ───────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@vidyora.com" },
    update: {
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      name: "VIDYORA Super Admin",
    },
    create: {
      email: "admin@vidyora.com",
      name: "VIDYORA Super Admin",
      phone: "+919000000001",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const seller1User = await prisma.user.upsert({
    where: { email: "seller1@vidyora.com" },
    update: {},
    create: {
      email: "seller1@vidyora.com",
      name: "TechMart India",
      phone: "+919000000002",
      passwordHash,
      role: UserRole.SELLER,
      emailVerified: new Date(),
    },
  });

  const seller2User = await prisma.user.upsert({
    where: { email: "seller2@vidyora.com" },
    update: {},
    create: {
      email: "seller2@vidyora.com",
      name: "FashionHub",
      phone: "+919000000003",
      passwordHash,
      role: UserRole.SELLER,
      emailVerified: new Date(),
    },
  });

  const customers = await Promise.all(
    [
      { email: "customer1@example.com", name: "Rahul Sharma", phone: "+919100000001" },
      { email: "customer2@example.com", name: "Priya Patel", phone: "+919100000002" },
      { email: "customer3@example.com", name: "Amit Kumar", phone: "+919100000003" },
    ].map((c) =>
      prisma.user.upsert({
        where: { email: c.email },
        update: {},
        create: {
          ...c,
          passwordHash,
          role: UserRole.CUSTOMER,
          emailVerified: new Date(),
        },
      }),
    ),
  );

  // ─── Seller Profiles ─────────────────────────────────────────────────────
  const seller1 = await prisma.sellerProfile.upsert({
    where: { sellerId: seller1User.id },
    update: {},
    create: {
      sellerId: seller1User.id,
      businessName: "TechMart India Pvt Ltd",
      businessEmail: "seller1@vidyora.com",
      businessPhone: "+919000000002",
      gstNumber: "29AABCT1234F1Z5",
      panNumber: "AABCT1234F",
      businessAddress: {
        line1: "123 Tech Park",
        city: "Bangalore",
        state: "Karnataka",
        country: "IN",
        postalCode: "560001",
      },
      kycStatus: KycStatus.VERIFIED,
      verificationStatus: SellerVerificationStatus.APPROVED,
      commissionPercentage: 8,
    },
  });

  const seller2 = await prisma.sellerProfile.upsert({
    where: { sellerId: seller2User.id },
    update: {},
    create: {
      sellerId: seller2User.id,
      businessName: "FashionHub Retail",
      businessEmail: "seller2@vidyora.com",
      businessPhone: "+919000000003",
      gstNumber: "27AABFH5678G1Z9",
      panNumber: "AABFH5678G",
      businessAddress: {
        line1: "456 Fashion Street",
        city: "Mumbai",
        state: "Maharashtra",
        country: "IN",
        postalCode: "400001",
      },
      kycStatus: KycStatus.VERIFIED,
      verificationStatus: SellerVerificationStatus.APPROVED,
      commissionPercentage: 12,
    },
  });

  // ─── Categories ──────────────────────────────────────────────────────────
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Latest electronics and gadgets",
      sortOrder: 1,
      metaTitle: "Electronics | VIDYORA",
      metaDescription: "Shop the latest electronics on VIDYORA",
    },
  });

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: {
      name: "Mobiles",
      slug: "mobiles",
      description: "Smartphones and accessories",
      parentId: electronics.id,
      sortOrder: 1,
      metaTitle: "Mobile Phones | VIDYORA",
    },
  });

  await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      description: "Laptops and notebooks",
      parentId: electronics.id,
      sortOrder: 2,
    },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: {
      name: "Fashion",
      slug: "fashion",
      description: "Clothing and accessories",
      sortOrder: 2,
    },
  });

  const mensFashion = await prisma.category.upsert({
    where: { slug: "mens-fashion" },
    update: {},
    create: {
      name: "Men's Fashion",
      slug: "mens-fashion",
      parentId: fashion.id,
      sortOrder: 1,
    },
  });

  // Category attributes for mobiles
  await prisma.categoryAttribute.upsert({
    where: { categoryId_slug: { categoryId: mobiles.id, slug: "ram" } },
    update: {},
    create: {
      categoryId: mobiles.id,
      name: "RAM",
      slug: "ram",
      type: "select",
      options: ["4GB", "6GB", "8GB", "12GB", "16GB"],
      isRequired: true,
      isFilterable: true,
      sortOrder: 1,
    },
  });

  await prisma.categoryAttribute.upsert({
    where: { categoryId_slug: { categoryId: mobiles.id, slug: "storage" } },
    update: {},
    create: {
      categoryId: mobiles.id,
      name: "Storage",
      slug: "storage",
      type: "select",
      options: ["64GB", "128GB", "256GB", "512GB"],
      isRequired: true,
      isFilterable: true,
      sortOrder: 2,
    },
  });

  // ─── Products ────────────────────────────────────────────────────────────
  const iphone = await prisma.product.upsert({
    where: { slug: "apple-iphone-15-128gb" },
    update: {},
    create: {
      sellerId: seller1.sellerId,
      categoryId: mobiles.id,
      name: "Apple iPhone 15 (128GB)",
      slug: "apple-iphone-15-128gb",
      description:
        "The iPhone 15 features a stunning 6.1-inch Super Retina XDR display, A16 Bionic chip, advanced dual-camera system, and all-day battery life.",
      shortDescription: "Latest iPhone 15 with 128GB storage",
      brand: "Apple",
      status: ProductStatus.ACTIVE,
      approvalStatus: ProductApprovalStatus.APPROVED,
      basePrice: 69999,
      compareAtPrice: 79999,
      tax: 18,
      thumbnail: "https://placehold.co/600x600/1a1a2e/ffffff?text=iPhone+15",
      attributes: { ram: "6GB", storage: "128GB", processor: "A16 Bionic" },
      metaTitle: "Apple iPhone 15 128GB | VIDYORA",
      metaDescription: "Buy Apple iPhone 15 128GB at best price on VIDYORA",
    },
  });

  const iphoneVariantBlack = await prisma.productVariant.upsert({
    where: { sku: "IPH15-128-BLK" },
    update: {},
    create: {
      productId: iphone.id,
      sku: "IPH15-128-BLK",
      price: 69999,
      compareAtPrice: 79999,
      stock: 50,
      attributes: { color: "Black", storage: "128GB" },
    },
  });

  const iphoneVariantBlue = await prisma.productVariant.upsert({
    where: { sku: "IPH15-128-BLU" },
    update: {},
    create: {
      productId: iphone.id,
      sku: "IPH15-128-BLU",
      price: 69999,
      compareAtPrice: 79999,
      stock: 30,
      attributes: { color: "Blue", storage: "128GB" },
    },
  });

  await prisma.productPolicy.upsert({
    where: { productId: iphone.id },
    update: {},
    create: {
      productId: iphone.id,
      returnAllowed: true,
      returnWindowDays: 7,
      replacementAllowed: true,
      replacementWindowDays: 7,
      warrantyAvailable: true,
      warrantyMonths: 12,
      policyDescription: "7-day return/replacement. 1-year manufacturer warranty.",
    },
  });

  await prisma.productImage.createMany({
    data: [
      {
        productId: iphone.id,
        variantId: iphoneVariantBlack.id,
        url: "https://placehold.co/800x800/1a1a2e/ffffff?text=iPhone+15+Black",
        altText: "Apple iPhone 15 Black",
        sortOrder: 0,
      },
      {
        productId: iphone.id,
        variantId: iphoneVariantBlue.id,
        url: "https://placehold.co/800x800/1e3a5f/ffffff?text=iPhone+15+Blue",
        altText: "Apple iPhone 15 Blue",
        sortOrder: 1,
      },
    ],
    skipDuplicates: true,
  });

  const samsung = await prisma.product.upsert({
    where: { slug: "samsung-galaxy-s24-256gb" },
    update: {},
    create: {
      sellerId: seller1.sellerId,
      categoryId: mobiles.id,
      name: "Samsung Galaxy S24 (256GB)",
      slug: "samsung-galaxy-s24-256gb",
      description:
        "Galaxy S24 with Galaxy AI, 6.2-inch Dynamic AMOLED 2X display, Snapdragon 8 Gen 3, and pro-grade camera.",
      shortDescription: "Flagship Samsung Galaxy S24",
      brand: "Samsung",
      status: ProductStatus.ACTIVE,
      approvalStatus: ProductApprovalStatus.APPROVED,
      basePrice: 74999,
      compareAtPrice: 85999,
      tax: 18,
      thumbnail: "https://placehold.co/600x600/2d2d44/ffffff?text=Galaxy+S24",
      attributes: { ram: "8GB", storage: "256GB" },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "SGS24-256-GRY" },
    update: {},
    create: {
      productId: samsung.id,
      sku: "SGS24-256-GRY",
      price: 74999,
      compareAtPrice: 85999,
      stock: 40,
      attributes: { color: "Gray", storage: "256GB" },
    },
  });

  await prisma.productPolicy.upsert({
    where: { productId: samsung.id },
    update: {},
    create: {
      productId: samsung.id,
      returnAllowed: true,
      returnWindowDays: 7,
      replacementAllowed: true,
      replacementWindowDays: 7,
      warrantyAvailable: true,
      warrantyMonths: 12,
    },
  });

  const tshirt = await prisma.product.upsert({
    where: { slug: "premium-cotton-t-shirt-navy" },
    update: {},
    create: {
      sellerId: seller2.sellerId,
      categoryId: mensFashion.id,
      name: "Premium Cotton T-Shirt - Navy",
      slug: "premium-cotton-t-shirt-navy",
      description: "100% premium cotton t-shirt. Comfortable fit for everyday wear.",
      shortDescription: "Premium cotton tee in navy blue",
      brand: "FashionHub",
      status: ProductStatus.ACTIVE,
      approvalStatus: ProductApprovalStatus.APPROVED,
      basePrice: 799,
      compareAtPrice: 1299,
      tax: 5,
      thumbnail: "https://placehold.co/600x600/1e40af/ffffff?text=T-Shirt",
    },
  });

  for (const size of ["S", "M", "L", "XL"]) {
    await prisma.productVariant.upsert({
      where: { sku: `TSH-NVY-${size}` },
      update: {},
      create: {
        productId: tshirt.id,
        sku: `TSH-NVY-${size}`,
        price: 799,
        compareAtPrice: 1299,
        stock: 100,
        attributes: { color: "Navy", size },
      },
    });
  }

  await prisma.productPolicy.upsert({
    where: { productId: tshirt.id },
    update: {},
    create: {
      productId: tshirt.id,
      returnAllowed: true,
      returnWindowDays: 15,
      replacementAllowed: true,
      replacementWindowDays: 15,
      warrantyAvailable: false,
    },
  });

  // ─── Coupons ─────────────────────────────────────────────────────────────
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "10% off on first order",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minimumOrderValue: 500,
      maximumDiscount: 2000,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2026-12-31"),
      usageLimit: 10000,
      perUserLimit: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FESTIVE20" },
    update: { isActive: true },
    create: {
      code: "FESTIVE20",
      description: "20% off festive jewellery",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minimumOrderValue: 10000,
      maximumDiscount: 15000,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2027-12-31"),
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "GOLD500" },
    update: { isActive: true },
    create: {
      code: "GOLD500",
      description: "₹500 off on gold jewellery",
      discountType: DiscountType.FIXED,
      discountValue: 500,
      minimumOrderValue: 5000,
      maximumDiscount: 500,
      startDate: new Date("2025-01-01"),
      expiryDate: new Date("2027-12-31"),
      usageLimit: 500,
      perUserLimit: 1,
      isActive: true,
    },
  });

  // ─── Demo orders for admin review ────────────────────────────────────────
  const customer1 = customers[0];
  const customer2 = customers[1];
  const tshirtVariant = await prisma.productVariant.findUnique({
    where: { sku: "TSH-NVY-M" },
  });
  const samsungVariant = await prisma.productVariant.findUnique({
    where: { sku: "SGS24-256-GRY" },
  });

  const shippingAddress = {
    name: customer1.name ?? "Rahul Sharma",
    phone: customer1.phone ?? "+919100000001",
    addressLine1: "14, MG Road",
    addressLine2: "Near City Centre",
    city: "Mumbai",
    state: "Maharashtra",
    country: "IN",
    postalCode: "400001",
  };

  if (customer1 && customer2 && tshirtVariant && samsungVariant) {
    const existingDemo = await prisma.order.findUnique({
      where: { orderNumber: "VDY-DEMO-001" },
    });

    if (!existingDemo) {
      const priceA = Number(iphoneVariantBlack.price);
      const priceB = Number(samsungVariant.price);
      const subtotal = priceA + priceB;
      const tax = Math.round(subtotal * 0.03);
      const total = subtotal + tax;

      const demoOrder = await prisma.order.create({
        data: {
          orderNumber: "VDY-DEMO-001",
          userId: customer1.id,
          subtotal,
          discount: 0,
          shippingFee: 0,
          tax,
          total,
          paymentStatus: "PAID",
          orderStatus: "DELIVERED",
          shippingAddress,
          billingAddress: shippingAddress,
          couponCode: "WELCOME10",
          items: {
            create: [
              {
                productId: iphone.id,
                variantId: iphoneVariantBlack.id,
                sellerId: seller1.sellerId,
                quantity: 1,
                price: priceA,
                tax: Math.round(priceA * 0.03),
                total: priceA,
                productName: iphone.name,
                sku: iphoneVariantBlack.sku,
                variantLabel: "Black",
              },
              {
                productId: samsung.id,
                variantId: samsungVariant.id,
                sellerId: seller1.sellerId,
                quantity: 1,
                price: priceB,
                tax: Math.round(priceB * 0.03),
                total: priceB,
                productName: samsung.name,
                sku: samsungVariant.sku,
                variantLabel: "Gray",
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
        },
        include: { items: true },
      });

      if (demoOrder.items[0]) {
        await prisma.review.create({
          data: {
            userId: customer1.id,
            productId: demoOrder.items[0].productId,
            orderItemId: demoOrder.items[0].id,
            rating: 5,
            title: "Beautiful piece",
            comment: "Excellent finish and premium packaging.",
            status: "PENDING",
          },
        });
      }
    }

    const existingDemo2 = await prisma.order.findUnique({
      where: { orderNumber: "VDY-DEMO-002" },
    });

    if (!existingDemo2) {
      const price = Number(tshirtVariant.price);
      const tax = Math.round(price * 0.05);
      await prisma.order.create({
        data: {
          orderNumber: "VDY-DEMO-002",
          userId: customer2.id,
          subtotal: price,
          discount: 0,
          shippingFee: 50,
          tax,
          total: price + tax + 50,
          paymentStatus: "PENDING",
          orderStatus: "CONFIRMED",
          shippingAddress: {
            ...shippingAddress,
            name: customer2.name ?? "Priya Patel",
            phone: customer2.phone ?? "+919100000002",
          },
          billingAddress: {
            ...shippingAddress,
            name: customer2.name ?? "Priya Patel",
            phone: customer2.phone ?? "+919100000002",
          },
          couponCode: "GOLD500",
          items: {
            create: {
              productId: tshirt.id,
              variantId: tshirtVariant.id,
              sellerId: seller2.sellerId,
              quantity: 1,
              price,
              tax,
              total: price,
              productName: tshirt.name,
              sku: tshirtVariant.sku,
              variantLabel: "M",
            },
          },
          payments: {
            create: {
              provider: "COD",
              transactionId: "cod_demo_002",
              amount: price + tax + 50,
              currency: "INR",
              status: "CREATED",
            },
          },
        },
      });
    }
  }

  // ─── Customer carts & wishlists ──────────────────────────────────────────
  for (const customer of customers) {
    await prisma.cart.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id },
    });
    await prisma.wishlist.upsert({
      where: { userId: customer.id },
      update: {},
      create: { userId: customer.id },
    });
  }

  const { seedStoreAndHelpContent } = await import("./seed-content");
  await seedStoreAndHelpContent(prisma);

  console.log("✅ Seed completed successfully!");
  console.log("\n📋 Test credentials (password: Password@123):");
  console.log("  Super Admin:  admin@vidyora.com");
  console.log("  Seller Admin: seller1@vidyora.com");
  console.log("  Seller Admin: seller2@vidyora.com");
  console.log("  Customer:     customer1@example.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

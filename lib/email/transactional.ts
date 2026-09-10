import { formatCurrency } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { sendEmail, EMAIL_TEMPLATES, isEmailConfigured } from "@/lib/email";
import { getEmailAppUrl } from "@/lib/email/app-url";

async function safeSend(
  label: string,
  run: () => Promise<void>,
): Promise<void> {
  try {
    await run();
  } catch (error) {
    console.error(`[email:${label}]`, error);
  }
}

export async function notifyOrderConfirmed(orderId: string) {
  await safeSend("order-confirmed", async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                name: true,
                seller: {
                  select: {
                    businessName: true,
                    businessEmail: true,
                    seller: { select: { email: true, name: true } },
                    notifyNewOrders: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!order?.user?.email) return;

    const total = formatCurrency(Number(order.total));
    const orderLink = `${getEmailAppUrl()}/orders/${order.id}`;
    const template = EMAIL_TEMPLATES.orderConfirmation({
      customerName: order.user.name || "Customer",
      orderNumber: order.orderNumber,
      orderTotal: total,
      orderLink,
    });

    await sendEmail({
      to: { email: order.user.email, name: order.user.name || undefined },
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    const sellerEmails = new Map<string, { name: string; email: string }>();
    for (const item of order.items) {
      const seller = item.product.seller;
      if (seller.notifyNewOrders === false) continue;
      const email = seller.businessEmail || seller.seller.email;
      if (!email) continue;
      sellerEmails.set(email, {
        email,
        name: seller.businessName || seller.seller.name || "Seller",
      });
    }

    for (const seller of sellerEmails.values()) {
      await sendEmail({
        to: seller,
        subject: `New order ${order.orderNumber} on VIDYORA`,
        html: `<p>Hi ${seller.name}, you have a new order <strong>${order.orderNumber}</strong> (${total}). <a href="${getEmailAppUrl()}/seller/orders">Open seller orders</a></p>`,
        text: `New order ${order.orderNumber} (${total}). Open ${getEmailAppUrl()}/seller/orders`,
      });
    }
  });
}

export async function notifyOrderShipped(
  orderId: string,
  trackingNumber?: string | null,
) {
  await safeSend("order-shipped", async () => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!order?.user?.email) return;

    const template = EMAIL_TEMPLATES.orderShipped({
      customerName: order.user.name || "Customer",
      orderNumber: order.orderNumber,
      trackingNumber: trackingNumber || undefined,
    });

    await sendEmail({
      to: { email: order.user.email, name: order.user.name || undefined },
      subject: template.subject,
      html: `${template.html}<p><a href="${getEmailAppUrl()}/orders/${order.id}">Track order</a></p>`,
      text: template.text,
    });
  });
}

export async function notifyProductRejected(productId: string, reason: string) {
  await safeSend("product-rejected", async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            businessName: true,
            businessEmail: true,
            seller: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!product) return;

    const email =
      product.seller.businessEmail || product.seller.seller.email;
    if (!email) return;

    const template = EMAIL_TEMPLATES.productRejected({
      sellerName:
        product.seller.businessName ||
        product.seller.seller.name ||
        "Seller",
      productName: product.name,
      reason,
    });

    await sendEmail({
      to: { email },
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  });
}

export async function notifyProductApproved(productId: string) {
  await safeSend("product-approved", async () => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            businessName: true,
            businessEmail: true,
            seller: { select: { email: true, name: true } },
          },
        },
      },
    });
    if (!product) return;
    const email =
      product.seller.businessEmail || product.seller.seller.email;
    if (!email) return;

    const template = EMAIL_TEMPLATES.productApproved({
      sellerName:
        product.seller.businessName ||
        product.seller.seller.name ||
        "Seller",
      productName: product.name,
      productLink: `${getEmailAppUrl()}/seller/products`,
    });

    await sendEmail({
      to: { email },
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  });
}

export async function notifyKycStatus(
  sellerUserId: string,
  status: "VERIFIED" | "REJECTED",
  reason?: string | null,
) {
  await safeSend("kyc-status", async () => {
    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId: sellerUserId },
      include: { seller: { select: { email: true, name: true } } },
    });
    if (!profile?.seller.email) return;

    const subject =
      status === "VERIFIED"
        ? "KYC verified on VIDYORA"
        : "KYC needs attention on VIDYORA";
    const html =
      status === "VERIFIED"
        ? `<p>Hi ${profile.businessName}, your KYC is verified. You can continue selling on VIDYORA.</p>`
        : `<p>Hi ${profile.businessName}, your KYC was rejected.${reason ? ` Reason: ${reason}` : ""} Please update documents from Profile &amp; KYC.</p>`;

    await sendEmail({
      to: {
        email: profile.seller.email,
        name: profile.seller.name || undefined,
      },
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""),
    });
  });
}

export async function notifyLowStockIfNeeded(
  sellerUserId: string,
  productName: string,
  available: number,
) {
  if (available > 10) return;
  await safeSend("low-stock", async () => {
    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId: sellerUserId },
      include: { seller: { select: { email: true, name: true } } },
    });
    if (!profile?.notifyLowStock) return;
    const email = profile.businessEmail || profile.seller.email;
    if (!email) return;

    await sendEmail({
      to: { email, name: profile.businessName },
      subject: `Low stock: ${productName}`,
      html: `<p>Hi ${profile.businessName}, <strong>${productName}</strong> is low on stock (available: ${available}). <a href="${getEmailAppUrl()}/seller/inventory">Update inventory</a></p>`,
      text: `Low stock for ${productName}: ${available} available.`,
    });
  });
}

export { isEmailConfigured };

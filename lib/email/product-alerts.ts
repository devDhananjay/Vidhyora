import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { getEmailAppUrl } from "@/lib/email/app-url";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

async function markAlertNotified(alertId: string) {
  await prisma.productAlert.update({
    where: { id: alertId },
    data: { notifiedAt: new Date(), active: false },
  });
}

/**
 * When a variant goes from OOS → in stock, notify active BACK_IN_STOCK subscribers.
 * Honors UserNotificationPreference.productBackInStock when the alert is linked to a user.
 */
export async function notifyBackInStockIfNeeded(input: {
  productId: string;
  variantId: string;
  previousAvailable: number;
  nextAvailable: number;
  productName: string;
  productSlug: string;
}) {
  if (input.previousAvailable > 0 || input.nextAvailable <= 0) return;

  const alerts = await prisma.productAlert.findMany({
    where: {
      productId: input.productId,
      type: "BACK_IN_STOCK",
      active: true,
      OR: [{ variantId: input.variantId }, { variantId: null }],
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          notificationPreference: {
            select: { productBackInStock: true },
          },
        },
      },
    },
    take: 200,
  });

  if (alerts.length === 0) return;

  const link = `${getEmailAppUrl()}/products/${input.productSlug}`;

  for (const alert of alerts) {
    const prefs = alert.user?.notificationPreference;
    if (prefs && prefs.productBackInStock === false) continue;

    const to = alert.email || alert.user?.email;
    if (!to) continue;

    try {
      if (!isEmailConfigured()) {
        console.warn(
          `[email:back-in-stock] skipped for ${to} — email not configured`,
        );
      }
      const name = alert.name || alert.user?.name || "there";
      await sendEmail({
        to: { email: to, name },
        subject: `Back in stock: ${input.productName}`,
        html: `<p>Hi ${name}, <strong>${input.productName}</strong> is back in stock on VIDYORA.</p><p><a href="${link}">View product</a></p>`,
        text: `Hi ${name}, ${input.productName} is back in stock. ${link}`,
      });
      await markAlertNotified(alert.id);
    } catch (error) {
      console.error("Back-in-stock email failed:", error);
    }
  }
}

/**
 * Notify PRICE_DROP subscribers when current price is below their baseline.
 * Honors UserNotificationPreference.priceDrops when the alert is linked to a user.
 */
export async function notifyPriceDropIfNeeded(input: {
  productId: string;
  variantId?: string | null;
  previousPrice: number;
  nextPrice: number;
  productName: string;
  productSlug: string;
}) {
  if (
    !Number.isFinite(input.nextPrice) ||
    !Number.isFinite(input.previousPrice) ||
    input.nextPrice >= input.previousPrice
  ) {
    return;
  }

  await processPriceDropAlerts({
    productId: input.productId,
    variantId: input.variantId,
    currentPriceOverride: input.nextPrice,
    productName: input.productName,
    productSlug: input.productSlug,
  });
}

type PriceDropScanOptions = {
  productId?: string;
  variantId?: string | null;
  /** When set (e.g. right after an update), use this instead of re-reading DB price. */
  currentPriceOverride?: number;
  productName?: string;
  productSlug?: string;
  limit?: number;
};

/**
 * Scan active PRICE_DROP alerts (optionally for one product) and email when
 * the live price is below each subscriber's baselinePrice.
 */
export async function processPriceDropAlerts(
  options: PriceDropScanOptions = {},
): Promise<{ notified: number; scanned: number }> {
  const limit = options.limit ?? 200;
  const alerts = await prisma.productAlert.findMany({
    where: {
      type: "PRICE_DROP",
      active: true,
      ...(options.productId ? { productId: options.productId } : {}),
      ...(options.variantId
        ? { OR: [{ variantId: options.variantId }, { variantId: null }] }
        : {}),
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          status: true,
          approvalStatus: true,
          variants: {
            where: { isActive: true },
            select: { id: true, price: true },
            orderBy: { price: "asc" },
            take: 20,
          },
        },
      },
      user: {
        select: {
          email: true,
          name: true,
          notificationPreference: {
            select: { priceDrops: true },
          },
        },
      },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let notified = 0;

  for (const alert of alerts) {
    const product = alert.product;
    if (
      !product ||
      product.status !== "ACTIVE" ||
      product.approvalStatus !== "APPROVED"
    ) {
      continue;
    }

    const prefs = alert.user?.notificationPreference;
    if (prefs && prefs.priceDrops === false) continue;

    const baseline = alert.baselinePrice != null ? Number(alert.baselinePrice) : NaN;
    if (!Number.isFinite(baseline)) continue;

    let currentPrice = options.currentPriceOverride;
    if (currentPrice == null) {
      if (alert.variantId) {
        const matched = product.variants.find((v) => v.id === alert.variantId);
        currentPrice = matched
          ? Number(matched.price)
          : Number(product.variants[0]?.price ?? product.basePrice);
      } else {
        currentPrice = Number(product.variants[0]?.price ?? product.basePrice);
      }
    }

    if (!Number.isFinite(currentPrice) || currentPrice >= baseline) continue;

    const to = alert.email || alert.user?.email;
    if (!to) continue;

    const name = alert.name || alert.user?.name || "there";
    const productName = options.productName || product.name;
    const productSlug = options.productSlug || product.slug;
    const link = `${getEmailAppUrl()}/products/${productSlug}`;

    try {
      if (!isEmailConfigured()) {
        console.warn(
          `[email:price-drop] skipped for ${to} — email not configured`,
        );
      }
      await sendEmail({
        to: { email: to, name },
        subject: `Price drop: ${productName}`,
        html: `<p>Hi ${name}, good news — <strong>${productName}</strong> dropped from ${formatInr(baseline)} to ${formatInr(currentPrice)} on VIDYORA.</p><p><a href="${link}">View product</a></p>`,
        text: `Hi ${name}, ${productName} dropped from ${formatInr(baseline)} to ${formatInr(currentPrice)}. ${link}`,
      });
      await markAlertNotified(alert.id);
      notified += 1;
    } catch (error) {
      console.error("Price-drop email failed:", error);
    }
  }

  return { notified, scanned: alerts.length };
}

/**
 * Cron / inventory helper: for each stock change, fire BIS when OOS → available.
 */
export async function notifyBackInStockForStockChange(input: {
  productId: string;
  variantId: string;
  previousAvailable: number;
  nextAvailable: number;
  productName: string;
  productSlug: string;
}) {
  return notifyBackInStockIfNeeded(input);
}

import prisma from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { getEmailAppUrl } from "@/lib/email/app-url";

/**
 * When a variant goes from OOS → in stock, notify active BACK_IN_STOCK subscribers.
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
        to,
        subject: `Back in stock: ${input.productName}`,
        html: `<p>Hi ${name}, <strong>${input.productName}</strong> is back in stock on VIDYORA.</p><p><a href="${link}">View product</a></p>`,
        text: `Hi ${name}, ${input.productName} is back in stock. ${link}`,
      });
      await prisma.productAlert.update({
        where: { id: alert.id },
        data: { notifiedAt: new Date(), active: false },
      });
    } catch (error) {
      console.error("Back-in-stock email failed:", error);
    }
  }
}

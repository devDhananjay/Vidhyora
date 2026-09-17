"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { getEmailAppUrl } from "@/lib/email/app-url";
import type { ActionResult } from "@/lib/utils";

export async function nudgeSellerOnSlaOrder(
  orderId: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  include: {
                    seller: { select: { email: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const sellerEmails = new Map<string, { email: string; name: string }>();
    for (const item of order.items) {
      const profile = item.product.seller;
      const email = profile.businessEmail || profile.seller.email;
      if (!email) continue;
      sellerEmails.set(email, {
        email,
        name: profile.businessName || profile.seller.name || "Seller",
      });
    }

    if (sellerEmails.size === 0) {
      return { success: false, error: "No seller email found for this order" };
    }

    const link = `${getEmailAppUrl()}/seller/orders`;
    if (isEmailConfigured()) {
      for (const seller of sellerEmails.values()) {
        await sendEmail({
          to: { email: seller.email, name: seller.name },
          subject: `Reminder: Order ${order.orderNumber} needs fulfillment`,
          html: `<p>Hi ${seller.name},</p><p>Order <strong>${order.orderNumber}</strong> is past the fulfillment SLA and still open. Please pack/ship soon.</p><p><a href="${link}">Open seller orders</a></p>`,
          text: `Order ${order.orderNumber} is past SLA. Please fulfill: ${link}`,
        });
      }
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        slaNudgedAt: new Date(),
        notes: order.notes
          ? `${order.notes}\n[SLA] Seller nudged ${new Date().toISOString()}`
          : `[SLA] Seller nudged ${new Date().toISOString()}`,
      },
    });

    revalidatePath("/admin/orders/sla");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("SLA nudge error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to nudge seller",
    };
  }
}

export async function escalateSlaOrder(
  orderId: string,
  note?: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin();

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const stamp = new Date().toISOString();
    const adminNote = note?.trim()
      ? `[Escalated ${stamp} by ${session.user.email}] ${note.trim()}`
      : `[Escalated ${stamp} by ${session.user.email}]`;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        slaEscalatedAt: new Date(),
        slaAdminNote: order.slaAdminNote
          ? `${order.slaAdminNote}\n${adminNote}`
          : adminNote,
      },
    });

    revalidatePath("/admin/orders/sla");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("SLA escalate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to escalate",
    };
  }
}

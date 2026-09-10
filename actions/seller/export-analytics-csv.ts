"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import type { ActionResult } from "@/lib/utils";

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportSellerAnalyticsCsv(): Promise<
  ActionResult<{ csv: string; filename: string }>
> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const items = await prisma.orderItem.findMany({
      where: {
        sellerId: acting.sellerUserId,
        order: { createdAt: { gte: since } },
      },
      select: {
        orderId: true,
        quantity: true,
        order: {
          select: {
            orderNumber: true,
            createdAt: true,
            orderStatus: true,
            paymentStatus: true,
            total: true,
          },
        },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    const byOrder = new Map<
      string,
      {
        orderNumber: string;
        date: string;
        status: string;
        payment: string;
        total: number;
        itemCount: number;
      }
    >();

    for (const item of items) {
      const existing = byOrder.get(item.orderId);
      if (existing) {
        existing.itemCount += item.quantity;
        continue;
      }
      byOrder.set(item.orderId, {
        orderNumber: item.order.orderNumber,
        date: item.order.createdAt.toISOString(),
        status: item.order.orderStatus,
        payment: item.order.paymentStatus,
        total: Number(item.order.total),
        itemCount: item.quantity,
      });
    }

    const header = [
      "orderNumber",
      "date",
      "status",
      "payment",
      "total",
      "itemCount",
    ];
    const rows = [...byOrder.values()].map((row) =>
      [
        row.orderNumber,
        row.date,
        row.status,
        row.payment,
        row.total.toFixed(2),
        row.itemCount,
      ]
        .map(csvEscape)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const filename = `vidyora-seller-orders-90d-${new Date().toISOString().slice(0, 10)}.csv`;

    return { success: true, data: { csv, filename } };
  } catch (error) {
    console.error("exportSellerAnalyticsCsv error:", error);
    return { success: false, error: "Failed to export analytics CSV" };
  }
}

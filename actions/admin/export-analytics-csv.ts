"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function exportAdminAnalyticsCsv(): Promise<
  ActionResult<{ csv: string; filename: string }>
> {
  try {
    await requireAdmin();

    const since = new Date();
    since.setDate(since.getDate() - 90);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: {
        orderNumber: true,
        createdAt: true,
        orderStatus: true,
        paymentStatus: true,
        total: true,
        _count: { select: { items: true } },
      },
    });

    const header = [
      "orderNumber",
      "date",
      "status",
      "payment",
      "total",
      "itemCount",
    ];
    const rows = orders.map((order) =>
      [
        order.orderNumber,
        order.createdAt.toISOString(),
        order.orderStatus,
        order.paymentStatus,
        Number(order.total).toFixed(2),
        order._count.items,
      ]
        .map(csvEscape)
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");
    const filename = `vidyora-admin-orders-90d-${new Date().toISOString().slice(0, 10)}.csv`;

    return { success: true, data: { csv, filename } };
  } catch (error) {
    console.error("exportAdminAnalyticsCsv error:", error);
    return { success: false, error: "Failed to export analytics CSV" };
  }
}

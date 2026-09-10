import prisma from "@/lib/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";

/** Statuses treated as not yet fulfilled for SLA (no PROCESSING in schema). */
export const SLA_OPEN_STATUSES: OrderStatus[] = [
  "ORDERED",
  "CONFIRMED",
  "PACKED",
];

export const DEFAULT_SLA_DAYS = 3;

export function slaCutoffDate(days = DEFAULT_SLA_DAYS): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export function delayedOrdersWhere(
  days = DEFAULT_SLA_DAYS,
): Prisma.OrderWhereInput {
  return {
    orderStatus: { in: SLA_OPEN_STATUSES },
    createdAt: { lt: slaCutoffDate(days) },
  };
}

export async function findDelayedOrders(days = DEFAULT_SLA_DAYS) {
  return prisma.order.findMany({
    where: delayedOrdersWhere(days),
    include: {
      user: { select: { name: true, email: true } },
      items: {
        take: 2,
        select: {
          id: true,
          productName: true,
          product: { select: { thumbnail: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export function daysSince(date: Date | string): number {
  const created = typeof date === "string" ? new Date(date) : date;
  const ms = Date.now() - created.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

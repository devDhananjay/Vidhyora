"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { Address } from "@prisma/client";

export async function getUserAddresses(): Promise<Address[]> {
  const session = await requireAuth();
  return prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";

function revalidateAddressPaths() {
  revalidatePath("/account");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function setDefaultAddress(
  addressId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return { success: false, error: "Address not found" };
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    revalidateAddressPaths();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("setDefaultAddress error:", error);
    return { success: false, error: "Failed to set default address" };
  }
}

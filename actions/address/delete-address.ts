"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";

export async function deleteAddress(
  addressId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return {
        success: false,
        error: "Address not found",
      };
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    revalidatePath("/account/addresses");
    revalidatePath("/checkout");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Delete address error:", error);
    return {
      success: false,
      error: "Failed to delete address",
    };
  }
}

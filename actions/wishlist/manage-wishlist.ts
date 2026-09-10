"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";
import {
  getOrCreateWishlistSession,
  getWishlistSessionId,
} from "@/lib/wishlist/wishlist-session";

export async function addToWishlist(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    const { getIntegrationsSettings } = await import(
      "@/lib/content/integrations-settings"
    );
    const integrations = await getIntegrationsSettings();
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!integrations.guestWishlistEnabled && !session?.user?.id) {
      return {
        success: false,
        error: "Please sign in to save favourites",
      };
    }

    const owner = await getOrCreateWishlistSession();

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: owner.wishlistId,
        productId,
      },
    });

    if (existing) {
      return {
        success: true,
        data: undefined,
      };
    }

    const variant = await prisma.productVariant.findFirst({
      where: { productId, isActive: true },
      select: { id: true },
      orderBy: { price: "asc" },
    });

    await prisma.wishlistItem.create({
      data: {
        wishlistId: owner.wishlistId,
        productId,
        variantId: variant?.id,
      },
    });

    revalidatePath("/wishlist");
    revalidatePath("/products");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return {
      success: false,
      error: "Failed to add to wishlist",
    };
  }
}

export async function removeFromWishlist(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    const wishlistId = await getWishlistSessionId();
    if (!wishlistId) {
      return {
        success: false,
        error: "Wishlist not found",
      };
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId,
        productId,
      },
    });

    revalidatePath("/wishlist");
    revalidatePath("/products");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return {
      success: false,
      error: "Failed to remove from wishlist",
    };
  }
}

export async function getWishlistProductIds() {
  const wishlistId = await getWishlistSessionId();
  if (!wishlistId) return [];

  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId },
    select: { productId: true },
  });

  return items.map((item) => item.productId);
}

export async function getWishlist() {
  try {
    const wishlistId = await getWishlistSessionId();
    if (!wishlistId) return [];

    const wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: {
                  where: { isActive: true },
                  orderBy: { price: "asc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return wishlist?.items || [];
  } catch (error) {
    console.error("Get wishlist error:", error);
    return [];
  }
}

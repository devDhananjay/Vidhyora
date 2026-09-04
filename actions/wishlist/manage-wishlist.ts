"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AuthError, requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/utils";

export async function addToWishlist(
  productId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAuth();

    // Get or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: session.user.id },
      });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: {
        wishlistId: wishlist.id,
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
        wishlistId: wishlist.id,
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
    if (error instanceof AuthError || (error instanceof Error && error.name === "AuthError")) {
      return {
        success: false,
        error: "Please sign in to save favourites",
      };
    }
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
    const session = await requireAuth();

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    });

    if (!wishlist) {
      return {
        success: false,
        error: "Wishlist not found",
      };
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
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
    if (error instanceof AuthError || (error instanceof Error && error.name === "AuthError")) {
      return {
        success: false,
        error: "Please sign in to save favourites",
      };
    }
    console.error("Remove from wishlist error:", error);
    return {
      success: false,
      error: "Failed to remove from wishlist",
    };
  }
}

export async function getWishlistProductIds() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const items = await prisma.wishlistItem.findMany({
    where: { wishlist: { userId: session.user.id } },
    select: { productId: true },
  });

  return items.map((item) => item.productId);
}

export async function getWishlist() {
  try {
    const session = await requireAuth();

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
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

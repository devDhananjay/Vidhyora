import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { requireSeller } from "@/lib/auth-helpers";
import { isSellerAdmin } from "@/lib/roles";

export const VIEW_AS_SELLER_COOKIE = "vidyora-view-seller";

export type ActingSeller = {
  session: Awaited<ReturnType<typeof requireSeller>>;
  sellerUserId: string;
  profile: {
    id: string;
    sellerId: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
  };
  businessName: string;
  isAdminView: boolean;
};

export async function listSellersForAdminView() {
  return prisma.sellerProfile.findMany({
    select: {
      sellerId: true,
      businessName: true,
      seller: {
        select: { email: true, name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getActingSeller(): Promise<ActingSeller | null> {
  const session = await requireSeller();

  if (isSellerAdmin(session.user.role)) {
    const profile = await prisma.sellerProfile.findUnique({
      where: { sellerId: session.user.id },
      select: {
        id: true,
        sellerId: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
      },
    });
    if (!profile) return null;
    return {
      session,
      sellerUserId: profile.sellerId,
      profile,
      businessName: profile.businessName,
      isAdminView: false,
    };
  }

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(VIEW_AS_SELLER_COOKIE)?.value;

  if (preferredId) {
    const preferred = await prisma.sellerProfile.findUnique({
      where: { sellerId: preferredId },
      select: {
        id: true,
        sellerId: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
      },
    });
    if (preferred) {
      return {
        session,
        sellerUserId: preferred.sellerId,
        profile: preferred,
        businessName: preferred.businessName,
        isAdminView: true,
      };
    }
  }

  const jewelry = await prisma.user.findUnique({
    where: { email: "jewelry@vidyora.com" },
    select: { id: true },
  });

  const fallback = jewelry
    ? await prisma.sellerProfile.findUnique({
        where: { sellerId: jewelry.id },
        select: {
          id: true,
          sellerId: true,
          businessName: true,
          businessEmail: true,
          businessPhone: true,
        },
      })
    : await prisma.sellerProfile.findFirst({
        orderBy: { products: { _count: "desc" } },
        select: {
          id: true,
          sellerId: true,
          businessName: true,
          businessEmail: true,
          businessPhone: true,
        },
      });

  if (!fallback) return null;

  return {
    session,
    sellerUserId: fallback.sellerId,
    profile: fallback,
    businessName: fallback.businessName,
    isAdminView: true,
  };
}

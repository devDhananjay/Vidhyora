"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { VIEW_AS_SELLER_COOKIE } from "@/lib/seller-context";

export async function setViewAsSeller(sellerId: string, pathname?: string) {
  await requireAdmin();
  const nextSellerId = sellerId.trim();
  if (!nextSellerId) return;

  const cookieStore = await cookies();
  cookieStore.set(VIEW_AS_SELLER_COOKIE, nextSellerId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath("/seller", "layout");
  if (pathname && pathname.startsWith("/seller") && pathname !== "/seller") {
    revalidatePath(pathname);
  }

  const nextPath =
    pathname && pathname.startsWith("/seller") ? pathname : "/seller";
  redirect(nextPath);
}

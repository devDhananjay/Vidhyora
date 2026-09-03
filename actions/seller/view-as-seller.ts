"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { VIEW_AS_SELLER_COOKIE } from "@/lib/seller-context";

export async function setViewAsSeller(formData: FormData) {
  await requireAdmin();
  const sellerId = String(formData.get("sellerId") || "");
  if (!sellerId) return;

  const cookieStore = await cookies();
  cookieStore.set(VIEW_AS_SELLER_COOKIE, sellerId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath("/seller");
}

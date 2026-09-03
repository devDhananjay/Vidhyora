import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSellerAdmin, isSuperAdmin } from "@/lib/roles";

const sellerRoutes = ["/seller"];
const adminRoutes = ["/admin"];
const authRoutes = [
  "/login",
  "/register",
  "/seller/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];
const protectedRoutes = ["/account", "/orders", "/wishlist", "/checkout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  const isSellerRoute = sellerRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isAuthRoute && session?.user) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(
      new URL(callbackUrl ?? "/", request.url),
    );
  }

  if ((isSellerRoute || isAdminRoute || isProtectedRoute) && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isSuperAdmin(session?.user?.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    isSellerRoute &&
    !isSellerAdmin(session?.user?.role) &&
    !isSuperAdmin(session?.user?.role)
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/seller/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/orders/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/login",
    "/register",
    "/seller/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};

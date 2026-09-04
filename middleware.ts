import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSellerAdmin, isSuperAdmin } from "@/lib/roles";

const sellerRoutes = ["/seller"];
const sellerPublicRoutes = ["/seller/register"];
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

function matchesPrefix(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isSellerDashboardRoute(pathname: string) {
  if (sellerPublicRoutes.some((route) => matchesPrefix(pathname, route))) {
    return false;
  }
  return sellerRoutes.some((route) => matchesPrefix(pathname, route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();

  const isSellerRoute = isSellerDashboardRoute(pathname);
  const isAdminRoute = adminRoutes.some((route) => matchesPrefix(pathname, route));
  const isAuthRoute = authRoutes.some((route) => matchesPrefix(pathname, route));
  const isProtectedRoute = protectedRoutes.some((route) =>
    matchesPrefix(pathname, route),
  );

  if (isAuthRoute && session?.user) {
    if (matchesPrefix(pathname, "/seller/register")) {
      if (
        isSellerAdmin(session.user.role) ||
        isSuperAdmin(session.user.role)
      ) {
        return NextResponse.redirect(new URL("/seller", request.url));
      }
      return NextResponse.next();
    }
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl ?? "/", request.url));
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

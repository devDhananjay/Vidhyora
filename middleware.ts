import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import {
  dashboardPath,
  isPlatformAdmin,
  isSellerAdmin,
} from "@/lib/roles";
import { safeCallbackPath } from "@/lib/auth/callback-url";

const { auth } = NextAuth(authConfig);

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
const protectedRoutes = ["/account", "/orders"];

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
        isPlatformAdmin(session.user.role)
      ) {
        return NextResponse.redirect(new URL("/seller", request.url));
      }
      return NextResponse.next();
    }
    const callbackUrl = safeCallbackPath(
      request.nextUrl.searchParams.get("callbackUrl"),
    );
    return NextResponse.redirect(
      new URL(callbackUrl ?? dashboardPath(session.user.role), request.url),
    );
  }

  if ((isSellerRoute || isAdminRoute || isProtectedRoute) && !session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !isPlatformAdmin(session?.user?.role)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    isSellerRoute &&
    !isSellerAdmin(session?.user?.role) &&
    !isPlatformAdmin(session?.user?.role)
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
    "/checkout/:path*",
    "/login",
    "/register",
    "/seller/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};

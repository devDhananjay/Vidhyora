import Link from "next/link";
import {
  Handshake,
  Heart,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { MegaNav } from "@/components/storefront/mega-nav";
import { SiteFooter } from "@/components/storefront/site-footer";
import { auth } from "@/lib/auth";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="hidden border-b border-neutral-100 bg-[#f7f4f0] md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[12px] text-neutral-600">
          <div className="flex items-center">
            <a
              href="tel:1800-123-4567"
              className="flex items-center gap-1.5 pr-4 hover:text-[#8b2e2e]"
            >
              <Phone className="size-3" strokeWidth={1.6} />
              <span>1800-123-4567</span>
            </a>
            <span className="h-3 w-px bg-neutral-300" />
            <a
              href="mailto:support@vidyora.com"
              className="flex items-center gap-1.5 px-4 hover:text-[#8b2e2e]"
            >
              <Mail className="size-3" strokeWidth={1.6} />
              <span>support@vidyora.com</span>
            </a>
          </div>
          <div className="flex items-center">
            <Link href={ROUTES.orders} className="px-3 hover:text-[#8b2e2e]">
              Track Order
            </Link>
            <span className="h-3 w-px bg-neutral-300" />
            <Link href="/store-locator" className="px-3 hover:text-[#8b2e2e]">
              Store Locator
            </Link>
            <span className="h-3 w-px bg-neutral-300" />
            <Link href="/help" className="pl-3 hover:text-[#8b2e2e]">
              Help
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 overflow-visible border-b border-neutral-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
          <Link href={ROUTES.home} className="shrink-0">
            <span className="font-serif text-[32px] font-medium tracking-[0.12em] text-[#8b2e2e]">
              {APP_NAME}
            </span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <form action={ROUTES.products} className="relative w-full max-w-xl">
              <input
                type="search"
                name="q"
                placeholder="Search for gold necklace, diamond jewellery"
                className="h-10 w-full rounded-full border border-neutral-200 bg-white px-5 pr-11 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
                aria-label="Search jewellery"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-label="Search"
              >
                <Search className="size-4" />
              </button>
            </form>
          </div>

          <nav className="ml-auto flex items-center gap-1 text-neutral-700">
            <Link
              href={ROUTES.auth.sellerRegister}
              className="mr-1 hidden items-center gap-1.5 rounded-full border border-[#8b2e2e]/20 bg-[#8b2e2e]/5 px-3 py-1.5 text-[12px] font-medium text-[#8b2e2e] transition hover:bg-[#8b2e2e] hover:text-white lg:inline-flex"
            >
              <Handshake className="size-3.5" strokeWidth={1.75} />
              Partner with Us
            </Link>
            <Link
              href="/store-locator"
              className="rounded-full p-2 hover:bg-neutral-50"
              aria-label="Store locator"
            >
              <MapPin className="size-5" strokeWidth={1.5} />
            </Link>
            {session?.user ? (
              <>
                <Link
                  href={ROUTES.wishlist}
                  className="rounded-full p-2 hover:bg-neutral-50"
                  aria-label="Wishlist"
                >
                  <Heart className="size-5" strokeWidth={1.5} />
                </Link>
                <UserMenu user={session.user} />
                <CartIndicator />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full p-2 hover:bg-neutral-50"
                  aria-label="Login"
                >
                  <User className="size-5" strokeWidth={1.5} />
                </Link>
                <CartIndicator />
              </>
            )}
          </nav>
        </div>

        <MegaNav />
      </header>

      <main className="flex-1">{children}</main>

      <SiteFooter />
    </div>
  );
}

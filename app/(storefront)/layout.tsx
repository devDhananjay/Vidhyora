import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { CartIndicator } from "@/components/cart/cart-indicator";
import { WishlistIndicator } from "@/components/wishlist/wishlist-indicator";
import { SiteFooter } from "@/components/storefront/site-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";
import { getMegaMenuItems } from "@/lib/nav/get-mega-menu";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { phoneTelHref } from "@/lib/content/site-settings-defaults";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, megaMenu, siteSettings] = await Promise.all([
    auth(),
    getMegaMenuItems(),
    getSiteSettings(),
  ]);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? null,
        role: session.user.role,
        image: session.user.image ?? null,
      }
    : null;

  const { supportEmail, supportPhone } = siteSettings.contact;
  const tel = phoneTelHref(supportPhone);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="hidden border-b border-border bg-surface print:hidden md:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-[12px] text-muted-foreground">
          <div className="flex items-center">
            <a
              href={tel}
              className="flex items-center gap-1.5 pr-4 hover:text-brand"
            >
              <Phone className="size-3" strokeWidth={1.6} />
              <span>{supportPhone}</span>
            </a>
            <span className="h-3 w-px bg-border" />
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-1.5 px-4 hover:text-brand"
            >
              <Mail className="size-3" strokeWidth={1.6} />
              <span>{supportEmail}</span>
            </a>
          </div>
          <div className="flex items-center">
            <Link href={ROUTES.orders} className="px-3 hover:text-brand">
              Track Order
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link href={ROUTES.storeLocator} className="px-3 hover:text-brand">
              Store Locator
            </Link>
            <span className="h-3 w-px bg-border" />
            <Link href={ROUTES.help} className="pl-3 hover:text-brand">
              Help
            </Link>
          </div>
        </div>
      </div>

      <StorefrontHeader
        user={user}
        cartSlot={<CartIndicator />}
        wishlistSlot={<WishlistIndicator />}
        megaMenu={megaMenu}
      />

      <main className="storefront-main flex-1">{children}</main>

      <SiteFooter settings={siteSettings} />
    </div>
  );
}

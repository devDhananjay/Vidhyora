import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Bodoni_Moda, Caveat, Montserrat } from "next/font/google";
import "./globals.css";
import { FirebaseAnalytics } from "@/components/firebase/firebase-analytics";
import { AppDialogProvider } from "@/components/shared/app-dialog";
import { ActionToastProvider } from "@/components/shared/action-toast";
import { CartDrawerProvider } from "@/components/cart/cart-drawer";
import { WishlistDrawerProvider } from "@/components/wishlist/wishlist-drawer";
import { NavigationLoader } from "@/components/shared/navigation-loader";
import {
  APP_NAME,
  APP_DESCRIPTION,
  BRAND_OG_IMAGE_SRC,
  SEO_BRAND_NAME,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Helps Chrome/Android keep layout stable when the keyboard opens.
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: {
    default: SEO_BRAND_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [
      { url: "/favicon-32.png?v=7", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png?v=7", type: "image/png", sizes: "48x48" },
      { url: "/favicon-64.png?v=7", type: "image/png", sizes: "64x64" },
      { url: "/icon-192.png?v=7", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico?v=7", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=7", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    // Search engines only — on-site UI branding stays APP_NAME (VIDYORA)
    siteName: SEO_BRAND_NAME,
    title: SEO_BRAND_NAME,
    description: APP_DESCRIPTION,
    images: [
      {
        url: BRAND_OG_IMAGE_SRC,
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_BRAND_NAME,
    description: APP_DESCRIPTION,
    images: [BRAND_OG_IMAGE_SRC],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${bodoni.variable} ${caveat.variable} font-sans antialiased`}
      >
        {/* Dark / light mode — on hold for now
        <ThemeProvider>
          {children}
          <FirebaseAnalytics />
        </ThemeProvider>
        */}
        <AppDialogProvider>
          <ActionToastProvider>
            <CartDrawerProvider>
              <WishlistDrawerProvider>
                <Suspense fallback={null}>
                  <NavigationLoader />
                </Suspense>
                {children}
                <FirebaseAnalytics />
              </WishlistDrawerProvider>
            </CartDrawerProvider>
          </ActionToastProvider>
        </AppDialogProvider>
      </body>
    </html>
  );
}

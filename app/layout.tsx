import type { Metadata } from "next";
import { Bodoni_Moda, Caveat, Montserrat } from "next/font/google";
import "./globals.css";
import { FirebaseAnalytics } from "@/components/firebase/firebase-analytics";
import { AppDialogProvider } from "@/components/shared/app-dialog";
import { ActionToastProvider } from "@/components/shared/action-toast";
import { APP_NAME, APP_DESCRIPTION, APP_TAGLINE, BRAND_LOGO_SRC } from "@/lib/constants";
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

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: APP_NAME,
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [{ url: BRAND_LOGO_SRC }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    images: [BRAND_LOGO_SRC],
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
            {children}
            <FirebaseAnalytics />
          </ActionToastProvider>
        </AppDialogProvider>
      </body>
    </html>
  );
}

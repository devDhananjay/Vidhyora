"use client";

import { Bodoni_Moda, Montserrat } from "next/font/google";
import { useEffect } from "react";
import { ErrorScreen } from "@/components/error/error-screen";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${bodoni.variable} font-sans antialiased`}
      >
        <ErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}

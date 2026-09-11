"use client";

/**
 * Dark / light mode — on hold for now.
 * Re-enable by uncommenting ThemeProvider in app/layout.tsx
 * and ThemeToggle in header / dashboard / auth-frame.
 */
/*
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
*/

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

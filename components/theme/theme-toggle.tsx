"use client";

/**
 * Dark / light mode — on hold for now.
 * Re-enable ThemeToggle usages in storefront-header, dashboard-shell, auth-frame.
 */
/*
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = true }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition",
        compact
          ? "size-9 text-[#8b2e2e] hover:bg-[#8b2e2e]/10 dark:text-[#e8b4b4] dark:hover:bg-white/10"
          : "gap-2 border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {!mounted ? (
        <Sun className="size-5 opacity-0" strokeWidth={1.5} aria-hidden />
      ) : isDark ? (
        <Sun className="size-5" strokeWidth={1.5} />
      ) : (
        <Moon className="size-5" strokeWidth={1.5} />
      )}
      {!compact ? <span>{isDark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
*/

export function ThemeToggle(_props?: { className?: string; compact?: boolean }) {
  return null;
}

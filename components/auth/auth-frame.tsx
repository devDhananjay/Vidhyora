import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
// Dark / light mode — on hold for now
// import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthFrame({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface p-4 py-12">
      {/* Dark / light mode — on hold for now
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      */}
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center" aria-label="VIDYORA home">
            <BrandLogo size="lg" priority />
          </Link>
          <h1 className="mt-6 font-serif text-3xl text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_12px_40px_rgba(43,26,22,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

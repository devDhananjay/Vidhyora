import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";

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
    <div className="flex min-h-screen items-center justify-center bg-[#faf8f6] p-4 py-12">
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center" aria-label="VIDYORA home">
            <BrandLogo size="lg" priority />
          </Link>
          <h1 className="mt-6 font-serif text-3xl text-neutral-900">{title}</h1>
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        </div>
        <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-6 shadow-[0_12px_40px_rgba(43,26,22,0.06)] md:p-8">
          {children}
        </div>
        {footer ? (
          <div className="mt-6 space-y-3 text-center text-sm text-neutral-500">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

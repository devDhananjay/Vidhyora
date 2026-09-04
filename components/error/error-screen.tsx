"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

function Sparkle({
  className,
  delay,
}: {
  className: string;
  delay: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute text-[#c9a227] animate-vidyora-twinkle ${className}`}
      style={{ animationDelay: delay }}
    >
      ✦
    </span>
  );
}

export function ErrorScreen({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf6f0] text-[#2b1a16]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 size-[28rem] rounded-full bg-[#8b2e2e]/8 blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-[24rem] rounded-full bg-[#ead9c4]/80 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-serif text-sm tracking-[0.42em] text-[#8b2e2e]">
          VIDYORA
        </p>

        <div className="relative mt-8 h-[250px] w-[250px] sm:h-[320px] sm:w-[320px]">
          <div className="animate-vidyora-glow absolute inset-8 rounded-full bg-[#8b2e2e]/20 blur-2xl" />
          <Sparkle className="left-2 top-8 text-lg" delay="0s" />
          <Sparkle className="right-4 top-12 text-base" delay="0.6s" />
          <Sparkle className="bottom-10 left-6 text-xl" delay="1.1s" />
          <Sparkle className="bottom-16 right-2 text-sm" delay="1.7s" />
          <Image
            src="/error/jewellery-oops.gif"
            alt="A jewellery box with a gold necklace and floating sparkles"
            width={320}
            height={320}
            unoptimized
            className="animate-vidyora-float relative z-10 size-full object-contain drop-shadow-[0_18px_40px_rgba(139,46,46,0.18)]"
          />
        </div>

        <p className="mt-8 text-[11px] font-medium tracking-[0.32em] text-[#8b2e2e] uppercase">
          A little hiccup
        </p>
        <h1 className="mt-3 max-w-xl font-serif text-4xl leading-tight text-[#2b1a16] sm:text-5xl">
          This sparkle took a wrong turn
        </h1>
        <div className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
        <p className="mt-5 max-w-md text-sm leading-relaxed text-[#6b625c] sm:text-base">
          We couldn&apos;t finish loading this page. Give it another moment —
          your jewellery is still waiting.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="h-12 min-w-[148px] bg-[#8b2e2e] px-8 text-white hover:bg-[#732626]"
          >
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 min-w-[148px] border-[#ead9c4] bg-white/70 px-8 text-[#2b1a16] hover:bg-white hover:text-[#8b2e2e]"
          >
            <Link href={ROUTES.home}>Back to home</Link>
          </Button>
        </div>

        {error?.digest ? (
          <p className="mt-8 text-[10px] tracking-wide text-[#b7aaa2]">
            Ref {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}

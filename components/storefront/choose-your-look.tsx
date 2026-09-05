"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/content/homepage-defaults";
import type { HomepageLook } from "@/lib/validations/homepage";
import { MediaFill } from "@/components/storefront/media-fill";

type ChooseYourLookProps = {
  title?: string;
  looks?: HomepageLook[];
};

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function offsetFromCenter(index: number, active: number, length: number) {
  let delta = index - active;
  if (delta > length / 2) delta -= length;
  if (delta < -length / 2) delta += length;
  return delta;
}

export function ChooseYourLook({
  title = DEFAULT_HOMEPAGE_CONFIG.chooseYourLook.title,
  looks = DEFAULT_HOMEPAGE_CONFIG.chooseYourLook.looks,
}: ChooseYourLookProps) {
  const [active, setActive] = useState(Math.min(3, Math.max(0, looks.length - 1)));

  function go(delta: number) {
    setActive((current) => wrapIndex(current + delta, looks.length));
  }

  if (looks.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="overflow-hidden rounded-[28px] bg-[#f2ebe3] px-3 py-10 md:px-8 md:py-14">
        <h2 className="text-center font-serif text-3xl text-[#5c1f1f] md:text-5xl">
          {title}
        </h2>

        <div className="relative mt-8 md:mt-12">
          <div className="relative mx-auto flex h-[340px] items-end justify-center md:h-[420px]">
            {looks.map((look, index) => {
              const offset = offsetFromCenter(index, active, looks.length);
              const abs = Math.abs(offset);
              if (abs > 2) return null;

              const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.68;
              const translateX = offset * (abs === 0 ? 0 : abs === 1 ? 168 : 290);
              const zIndex = 30 - abs * 10;
              const opacity = abs === 0 ? 1 : abs === 1 ? 0.92 : 0.78;

              return (
                <Link
                  key={look.id}
                  href={look.href}
                  onClick={(event) => {
                    if (offset !== 0) {
                      event.preventDefault();
                      setActive(index);
                    }
                  }}
                  className="absolute bottom-10 origin-bottom transition-all duration-500 ease-out md:bottom-12"
                  style={{
                    transform: `translateX(${translateX}px) scale(${scale})`,
                    zIndex,
                    opacity,
                  }}
                  aria-label={look.title}
                >
                  <div
                    className={[
                      "relative overflow-hidden rounded-2xl bg-[#e7ddd2] shadow-[0_18px_40px_rgba(43,26,22,0.18)]",
                      abs === 0
                        ? "h-[260px] w-[190px] md:h-[340px] md:w-[240px]"
                        : "h-[220px] w-[150px] md:h-[280px] md:w-[190px]",
                    ].join(" ")}
                  >
                    <MediaFill
                      src={look.image}
                      alt={look.title}
                      className="object-cover"
                      sizes="(max-width: 768px) 190px, 240px"
                    />
                  </div>
                  <p
                    className={[
                      "mt-4 text-center text-sm text-[#3b231c] transition-opacity duration-300 md:text-base",
                      abs === 0 ? "font-medium opacity-100" : "opacity-80",
                    ].join(" ")}
                  >
                    {look.title}
                  </p>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous look"
            className="absolute left-1 top-1/2 z-40 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-[#5c1f1f] shadow-sm backdrop-blur-sm transition hover:bg-white/80 md:left-4 md:size-12"
          >
            <ChevronLeft className="size-5 md:size-6" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next look"
            className="absolute right-1 top-1/2 z-40 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-[#5c1f1f] shadow-sm backdrop-blur-sm transition hover:bg-white/80 md:right-4 md:size-12"
          >
            <ChevronRight className="size-5 md:size-6" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}

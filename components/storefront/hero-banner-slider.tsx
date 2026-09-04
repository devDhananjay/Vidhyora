"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shopHref } from "@/lib/nav/mega-menu-data";
import { cn } from "@/lib/utils";

type HeroSlide = {
  id: string;
  image: string;
  alt: string;
  panelColor: string;
  panelClassName: string;
  contentAlign: "right" | "right-soft";
  eyebrow?: string;
  title: ReactNode;
  subtitle: string;
  cta: string;
  ctaHref: string;
  ctaClassName: string;
};

const SLIDES: HeroSlide[] = [
  {
    id: "under-30k",
    image: "/images/banners/under-30k.jpg?v=3",
    alt: "Everyday diamond jewellery under 30k",
    panelColor: "#628f8b",
    panelClassName: "left-[50%]",
    contentAlign: "right",
    eyebrow: "PRESENTS",
    title: (
      <span className="font-script text-[clamp(2.6rem,6vw,4.75rem)] leading-none text-white">
        Under 30k
      </span>
    ),
    subtitle: "The Everyday Diamond Edit",
    cta: "SHOP NOW",
    ctaHref: shopHref({ maxPrice: "30000", collection: "Under 30K" }),
    ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
  },
  {
    id: "joy-of-dressing",
    image: "/images/banners/joy-of-dressing.jpg?v=3",
    alt: "Latest jewellery designs under 50k",
    panelColor: "#5c7a6a",
    panelClassName: "left-[48%]",
    contentAlign: "right",
    eyebrow: "PRESENTS",
    title: (
      <span className="text-white">
        <span className="block font-serif text-[clamp(1.6rem,3.4vw,2.6rem)] tracking-[0.04em]">
          The joy of
        </span>
        <span className="mt-1 block font-script text-[clamp(2.8rem,6.5vw,5rem)] leading-[0.9]">
          dressing
        </span>
      </span>
    ),
    subtitle: "Explore latest designs under 50k",
    cta: "SHOP NOW",
    ctaHref: shopHref({ maxPrice: "50000", collection: "Under 50K" }),
    ctaClassName: "bg-[#e9d9cc] text-[#8b2e2e] hover:bg-[#f0e4da]",
  },
  {
    id: "festival-of-diamonds",
    image: "/images/banners/festival-of-diamonds.jpg?v=3",
    alt: "Festival of Diamonds campaign",
    panelColor: "transparent",
    panelClassName: "left-[46%]",
    contentAlign: "right-soft",
    title: (
      <span className="font-serif text-[clamp(1.85rem,4vw,3.4rem)] leading-tight tracking-[0.02em] text-white">
        Festival Of Diamonds
        <span className="ml-1 inline-block text-[0.55em] align-super text-white/90">
          ✦
        </span>
      </span>
    ),
    subtitle: "Designs crafted for natural diamonds to sparkle the brightest",
    cta: "EXPLORE NOW",
    ctaHref: shopHref({
      type: "diamond",
      collection: "Festival of Diamonds",
    }),
    ctaClassName: "bg-white text-[#2b1a16] hover:bg-neutral-100",
  },
];

export function HeroBannerSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [active]);

  function go(delta: number) {
    setActive((current) => (current + delta + SLIDES.length) % SLIDES.length);
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#5c7a6a]">
      <div className="relative aspect-[21/9] w-full max-md:min-h-[220px] md:min-h-[340px] lg:min-h-[400px]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className="relative h-full w-full shrink-0"
              aria-hidden={index !== active}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                priority={index === 0}
                quality={95}
                className="object-cover object-left"
                sizes="100vw"
              />

              {slide.contentAlign === "right" ? (
                <div
                  className={cn("absolute inset-y-0 right-0", slide.panelClassName)}
                  style={{ backgroundColor: slide.panelColor }}
                />
              ) : (
                <div
                  className={cn(
                    "absolute inset-y-0 right-0 bg-gradient-to-l from-black/50 via-black/30 to-transparent",
                    slide.panelClassName,
                  )}
                />
              )}

              <div className="absolute inset-y-0 right-0 flex w-[50%] items-center justify-center px-4 sm:px-8 md:w-[48%] md:px-10 lg:px-14">
                <div className="flex max-w-md flex-col items-center text-center">
                  <Image
                    src="/brand/vidyora-monogram-clear.png"
                    alt="VIDYORA"
                    width={120}
                    height={120}
                    className="h-16 w-16 object-contain drop-shadow-md sm:h-20 sm:w-20 md:h-24 md:w-24"
                    unoptimized
                  />
                  <p className="mt-1.5 font-serif text-base tracking-[0.28em] text-white sm:text-lg md:text-xl">
                    VIDYORA
                  </p>
                  {slide.eyebrow ? (
                    <p className="mt-2 text-[9px] tracking-[0.35em] text-white/85 uppercase sm:text-[10px]">
                      {slide.eyebrow}
                    </p>
                  ) : null}
                  <div className="mt-3 sm:mt-4">{slide.title}</div>
                  <p
                    className={cn(
                      "mt-2 max-w-xs text-[11px] text-white/90 sm:mt-3 sm:text-sm md:text-[15px]",
                      slide.id === "joy-of-dressing" && "italic",
                    )}
                  >
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.ctaHref}
                    className={cn(
                      "mt-4 px-5 py-2 text-[10px] tracking-[0.22em] uppercase transition sm:mt-6 sm:px-7 sm:py-2.5 sm:text-xs",
                      slide.ctaClassName,
                    )}
                  >
                    {slide.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous banner"
          className="absolute top-1/2 left-2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#8b2e2e] shadow-md backdrop-blur-sm transition hover:bg-white md:left-4 md:size-14"
        >
          <ChevronLeft className="size-6 md:size-7" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next banner"
          className="absolute top-1/2 right-2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#8b2e2e] shadow-md backdrop-blur-sm transition hover:bg-white md:right-4 md:size-14"
        >
          <ChevronRight className="size-6 md:size-7" strokeWidth={2} />
        </button>

        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 sm:bottom-5">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === active
                  ? "w-8 bg-white"
                  : "w-2 bg-white/55 hover:bg-white/85",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

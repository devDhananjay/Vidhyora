"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/content/homepage-defaults";
import type { HomepageTradition } from "@/lib/validations/homepage";
import { MediaFill } from "@/components/storefront/media-fill";
import { cn } from "@/lib/utils";

type ExploreTraditionsProps = {
  title?: string;
  items?: HomepageTradition[];
};

function PinHead() {
  return (
    <span
      className="absolute top-0 left-1/2 z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c45c5c] shadow-[0_2px_4px_rgba(0,0,0,0.25)] ring-2 ring-[#f0d7d7]"
      aria-hidden
    />
  );
}

export function ExploreTraditions({
  title = DEFAULT_HOMEPAGE_CONFIG.exploreTraditions.title,
  items = DEFAULT_HOMEPAGE_CONFIG.exploreTraditions.items,
}: ExploreTraditionsProps) {
  const traditions =
    items.length > 0 ? items : DEFAULT_HOMEPAGE_CONFIG.exploreTraditions.items;
  const [active, setActive] = useState(0);
  const [hoveredMoment, setHoveredMoment] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % traditions.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [traditions.length]);

  const current = traditions[active];
  if (!current) return null;

  const sideCards = traditions.filter((_, index) => index !== active);

  function go(delta: number) {
    setActive(
      (currentIndex) =>
        (currentIndex + delta + traditions.length) % traditions.length,
    );
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-20">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#f7f1ea",
          backgroundImage: `
            radial-gradient(rgba(180,80,100,0.08) 1.2px, transparent 1.2px),
            radial-gradient(rgba(180,80,100,0.05) 1px, transparent 1px),
            linear-gradient(180deg, #faf5ef 0%, #f3ebe3 100%)
          `,
          backgroundSize: "28px 28px, 14px 14px, 100% 100%",
          backgroundPosition: "0 0, 10px 18px, 0 0",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <h2 className="text-center font-serif text-3xl tracking-[0.14em] text-[#8b2e2e] uppercase md:text-4xl">
          {title}
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:gap-5">
          <div className="relative min-h-[420px] overflow-hidden rounded-[22px] border border-[#e8d9c8] bg-[#fffaf4] shadow-[0_20px_50px_rgba(60,35,25,0.1)] md:min-h-[520px]">
            <div className="absolute inset-0">
              <MediaFill
                key={current.id}
                src={current.image}
                alt={current.title}
                className="object-cover object-[center_20%] transition duration-700"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
                play
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf4] via-[#fffaf4]/88 to-transparent md:via-[#fffaf4]/75" />
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
              <div>
                <h3 className="font-serif text-3xl tracking-[0.04em] text-[#8b2e2e] md:text-5xl">
                  {current.title}
                </h3>
                <p className="mt-2 text-sm text-[#8b2e2e]/80 md:text-base">
                  {current.subtitle}
                </p>
                <Link
                  href={current.href}
                  className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#8b2e2e] to-[#a34a4a] px-6 py-2.5 text-xs tracking-[0.18em] text-white uppercase shadow-[0_8px_20px_rgba(139,46,46,0.28)] transition hover:brightness-110"
                >
                  Explore
                </Link>
              </div>

              <div className="mt-10 flex items-end gap-3 md:gap-4">
                {current.moments.map((moment, index) => (
                  <Link
                    key={moment.label}
                    href={current.href}
                    onMouseEnter={() => setHoveredMoment(moment.label)}
                    onMouseLeave={() => setHoveredMoment(null)}
                    className="relative w-[30%] max-w-[120px] transition duration-300 hover:-translate-y-1"
                    style={{
                      transform: `rotate(${index === 0 ? -4 : index === 1 ? 2 : 5}deg)`,
                    }}
                  >
                    <div className="relative bg-white p-1.5 pb-7 shadow-[0_10px_24px_rgba(40,25,15,0.18)]">
                      <PinHead />
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#efe6dc]">
                        <MediaFill
                          src={moment.image}
                          alt={moment.label}
                          className="object-cover"
                          sizes="120px"
                          play
                        />
                      </div>
                      <p className="absolute inset-x-1 bottom-1.5 text-center text-[10px] tracking-[0.08em] text-[#8b2e2e] uppercase">
                        {moment.label}
                      </p>
                    </div>
                    {hoveredMoment === moment.label ? (
                      <span className="absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1 text-[10px] text-white shadow-lg">
                        Explore {current.title.split(" ")[0]} weddings
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[420px] gap-2 md:min-h-[520px] md:gap-3">
            {sideCards.map((tradition, index) => {
              const realIndex = traditions.findIndex(
                (item) => item.id === tradition.id,
              );
              return (
                <button
                  key={tradition.id}
                  type="button"
                  onClick={() => setActive(realIndex)}
                  className={cn(
                    "group relative flex-1 overflow-hidden rounded-[18px] border border-[#e8d9c8] bg-[#fffaf4] text-left shadow-[0_14px_34px_rgba(60,35,25,0.1)] transition duration-500",
                    "hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(60,35,25,0.14)]",
                  )}
                  style={{
                    transform: `translateY(${index * 6}px)`,
                  }}
                >
                  <div className="absolute inset-0">
                    <MediaFill
                      src={tradition.image}
                      alt={tradition.title}
                      className="object-cover object-center transition duration-700 group-hover:scale-105"
                      sizes="200px"
                      play
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#fffaf4]/95 via-[#fffaf4]/55 to-transparent" />
                  </div>
                  <div className="relative z-10 p-4 md:p-5">
                    <h3 className="font-serif text-lg tracking-[0.04em] text-[#8b2e2e] md:text-2xl">
                      {tradition.title}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#8b2e2e]/80 md:text-sm">
                      {tradition.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous tradition"
            className="flex size-10 items-center justify-center rounded-full border border-[#dcc9b4] bg-white text-[#8b2e2e] transition hover:border-[#8b2e2e]"
          >
            <ChevronLeft className="size-4" strokeWidth={1.8} />
          </button>
          <div className="flex items-center gap-2">
            {traditions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.title}`}
                onClick={() => setActive(index)}
                className={cn(
                  "size-2 rounded-full transition",
                  index === active ? "bg-[#8b2e2e]" : "bg-[#dcc9b4]",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next tradition"
            className="flex size-10 items-center justify-center rounded-full border border-[#dcc9b4] bg-white text-[#8b2e2e] transition hover:border-[#8b2e2e]"
          >
            <ChevronRight className="size-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}

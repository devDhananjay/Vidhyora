"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { shopHref } from "@/lib/nav/mega-menu-data";
import { Button } from "@/components/ui/button";

type Story = {
  id: string;
  title: string;
  subtitle: string;
  videoSrc: string;
  posterSrc: string;
  href: string;
};

function wrapIndex(index: number, length: number) {
  return (index % length + length) % length;
}

function StoryCard({
  story,
  isActive,
  positionClassName,
  onOpen,
  onHover,
}: {
  story: Story;
  isActive: boolean;
  positionClassName: string;
  onOpen: () => void;
  onHover: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={onHover}
      className={[
        positionClassName,
        "overflow-hidden rounded-[18px] border border-white/20 bg-[#0f0a08]",
      ].join(" ")}
      aria-label={`Open style story: ${story.title}`}
    >
      <div className="absolute inset-0">
        <Image
          src={story.posterSrc}
          alt={story.title}
          fill
          className="object-cover opacity-80"
          sizes="(max-width: 768px) 90vw, 520px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>

      <video
        src={story.videoSrc}
        poster={story.posterSrc}
        muted
        playsInline
        loop
        autoPlay={isActive}
        preload={isActive ? "metadata" : "none"}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
          Style Story
        </p>
        <p className="mt-2 font-serif text-2xl text-white drop-shadow">
          {story.title}
        </p>
        <p className="mt-1 text-sm text-white/80">{story.subtitle}</p>
      </div>

      {!isActive ? (
        <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-white/10 p-2">
          <Play className="size-5 text-white/90" strokeWidth={1.7} />
        </div>
      ) : null}
    </button>
  );
}

export function StyleStories() {
  // Public demo mp4s (replace with your own assets later).
  const items = useMemo<Story[]>(
    () => [
      {
        id: "everyday-diamonds",
        title: "Everyday Diamonds",
        subtitle: "Clean lines for daily wear",
        videoSrc:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterSrc:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1200&q=80",
        href: shopHref({ type: "diamond", occasion: "daily", collection: "Everyday Diamonds" }),
      },
      {
        id: "bridal-glow",
        title: "Bridal Glow",
        subtitle: "Statement pieces for wedding days",
        videoSrc:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterSrc:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
      },
      {
        id: "festive-gold",
        title: "Festive Gold",
        subtitle: "Warm tones for celebrations",
        videoSrc:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterSrc:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
        href: shopHref({ type: "gold", occasion: "festive", collection: "Festive Gold" }),
      },
      {
        id: "gift-edit",
        title: "Gift Edit",
        subtitle: "Easy wins when you want it perfect",
        videoSrc:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterSrc:
          "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=80",
        href: shopHref({ occasion: "festive", collection: "Gifting" }),
      },
      {
        id: "care-calm",
        title: "Care & Calm",
        subtitle: "Make your jewellery last longer",
        videoSrc:
          "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        posterSrc:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80",
        href: shopHref({ collection: "All Jewellery" }),
      },
    ],
    [],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const active = items[wrapIndex(activeIndex, items.length)];
  const prev = items[wrapIndex(activeIndex - 1, items.length)];
  const next = items[wrapIndex(activeIndex + 1, items.length)];

  function openModal() {
    setOpen(true);
  }

  function go(delta: number) {
    setActiveIndex((i) => wrapIndex(i + delta, items.length));
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <section className="bg-[#faf8f6] py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-primary">
              Styling
            </p>
            <h2 className="mt-2 font-serif text-4xl text-primary md:text-5xl">
              Styling 101 With Diamonds
            </h2>
            <span className="mx-auto mt-4 block h-px w-12 bg-primary/35" />
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-600 md:text-base">
              Tap a card to open the same layered story design, with video playing in the center.
            </p>
          </div>

          <div className="relative mx-auto mt-8 h-[360px] max-w-5xl md:mt-10 md:h-[440px]">
            {/* Left */}
            <StoryCard
              story={prev}
              isActive={false}
              positionClassName="absolute left-0 top-1/2 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[-3deg] md:block lg:left-4 lg:h-[300px] lg:w-[240px]"
              onOpen={openModal}
              onHover={() => setActiveIndex((i) => wrapIndex(i - 1, items.length))}
            />

            {/* Center */}
            <div className="absolute left-1/2 top-0 z-10 w-[min(92%,520px)] -translate-x-1/2">
              <StoryCard
                story={active}
                isActive={true}
                positionClassName="relative h-[320px] w-full md:h-[400px]"
                onOpen={openModal}
                onHover={() => {}}
              />
            </div>

            {/* Right */}
            <StoryCard
              story={next}
              isActive={false}
              positionClassName="absolute right-0 top-1/2 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[3deg] md:block lg:right-4 lg:h-[300px] lg:w-[240px]"
              onOpen={openModal}
              onHover={() => setActiveIndex((i) => wrapIndex(i + 1, items.length))}
            />

            {/* Mobile arrows */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 md:hidden">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-full border border-neutral-200 bg-white/80 p-2 shadow-sm"
                aria-label="Previous story"
              >
                <ChevronLeft className="size-5 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-full border border-neutral-200 bg-white/80 p-2 shadow-sm"
                aria-label="Next story"
              >
                <ChevronRight className="size-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-black/70 p-4 md:p-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">
                {active.title} · {active.subtitle}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="relative mt-6 flex items-center justify-center">
              {/* Prev */}
              <div className="hidden md:block">
                <StoryCard
                  story={prev}
                  isActive={false}
                  positionClassName="absolute left-0 top-1/2 w-[240px] -translate-y-1/2 rotate-[-4deg]"
                  onOpen={() => setActiveIndex((i) => wrapIndex(i - 1, items.length))}
                  onHover={() => setActiveIndex((i) => wrapIndex(i - 1, items.length))}
                />
              </div>

              {/* Center (active) */}
              <div className="relative z-10 w-[92%] max-w-[620px]">
                <div className="relative h-[380px] md:h-[470px] rounded-[20px] border border-white/15 bg-[#0f0a08] overflow-hidden">
                  <Image
                    src={active.posterSrc}
                    alt={active.title}
                    fill
                    className="object-cover opacity-60"
                  />
                  <video
                    src={active.videoSrc}
                    poster={active.posterSrc}
                    muted
                    playsInline
                    loop
                    autoPlay
                    controls
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-xs tracking-[0.2em] uppercase text-white/70">
                      Style Story
                    </p>
                    <h3 className="mt-2 font-serif text-3xl text-white drop-shadow">
                      {active.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-white/80">
                      {active.subtitle}.{" "}
                      <span className="text-white/90">
                        Pick the look below and shop instantly.
                      </span>
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button asChild className="rounded-full bg-primary px-6">
                        <Link href={active.href}>Shop the look</Link>
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="rounded-full border-white/30 bg-white/5 px-6 text-white hover:bg-white/10"
                      >
                        <Link href="/blog">Read styling notes</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next */}
              <div className="hidden md:block">
                <StoryCard
                  story={next}
                  isActive={false}
                  positionClassName="absolute right-0 top-1/2 w-[240px] -translate-y-1/2 rotate-[4deg]"
                  onOpen={() => setActiveIndex((i) => wrapIndex(i + 1, items.length))}
                  onHover={() => setActiveIndex((i) => wrapIndex(i + 1, items.length))}
                />
              </div>

              {/* Arrows */}
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="Previous story"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="Next story"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


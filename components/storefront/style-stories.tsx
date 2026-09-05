"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { shopHref } from "@/lib/nav/mega-menu-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Story = {
  id: string;
  title: string;
  subtitle: string;
  videoSrc: string;
  posterSrc: string;
  href: string;
};

const STYLING_VIDEO = "/videos/styling-101-diamonds.mp4?v=1";

function wrapIndex(index: number, length: number) {
  return (index % length + length) % length;
}

/** Safari-safe muted autoplay for the active center card. */
function StoryVideo({
  src,
  poster,
  active,
}: {
  src: string;
  poster: string;
  active: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.defaultMuted = true;
    el.muted = true;
    el.volume = 0;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "true");

    if (!active) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.setAttribute("src", src);
    el.load();

    const play = () => {
      el.muted = true;
      el.volume = 0;
      void el.play().catch(() => {});
    };

    el.addEventListener("loadeddata", play);
    el.addEventListener("canplay", play);
    play();

    return () => {
      el.removeEventListener("loadeddata", play);
      el.removeEventListener("canplay", play);
    };
  }, [src, active]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      playsInline
      loop
      autoPlay={active}
      preload={active ? "auto" : "none"}
      controls={false}
      className={cn(
        "absolute inset-0 h-full w-full object-cover",
        active ? "opacity-100" : "opacity-0",
      )}
    />
  );
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
        "overflow-hidden rounded-[18px] border border-[#ead9c4]/80 bg-[#faf6f0]",
      ].join(" ")}
      aria-label={`Open style story: ${story.title}`}
    >
      <div className="absolute inset-0">
        <Image
          src={story.posterSrc}
          alt={story.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, 520px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      </div>

      <StoryVideo
        src={story.videoSrc}
        poster={story.posterSrc}
        active={isActive}
      />

      <div className="absolute inset-x-0 bottom-0 p-5 text-left">
        <p className="text-xs uppercase tracking-[0.2em] text-white/80">
          Style Story
        </p>
        <p className="mt-2 font-serif text-2xl text-white drop-shadow">
          {story.title}
        </p>
        <p className="mt-1 text-sm text-white/85">{story.subtitle}</p>
      </div>

      {!isActive ? (
        <div className="pointer-events-none absolute top-5 left-5 rounded-full border border-white/40 bg-white/90 p-2 text-[#8b2e2e] shadow-sm">
          <Play className="size-5 fill-current" strokeWidth={1.5} />
        </div>
      ) : null}
    </button>
  );
}

export function StyleStories() {
  const items = useMemo<Story[]>(
    () => [
      {
        id: "everyday-diamonds",
        title: "Everyday Diamonds",
        subtitle: "Clean lines for daily wear",
        videoSrc: STYLING_VIDEO,
        posterSrc:
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80",
        href: shopHref({
          type: "diamond",
          occasion: "daily",
          collection: "Everyday Diamonds",
        }),
      },
      {
        id: "bridal-glow",
        title: "Bridal Glow",
        subtitle: "Statement pieces for wedding days",
        videoSrc: STYLING_VIDEO,
        posterSrc:
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80",
        href: shopHref({ occasion: "wedding", collection: "Wedding Jewellery" }),
      },
      {
        id: "festive-gold",
        title: "Festive Gold",
        subtitle: "Warm tones for celebrations",
        videoSrc: STYLING_VIDEO,
        posterSrc:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
        href: shopHref({
          type: "gold",
          occasion: "festive",
          collection: "Festive Gold",
        }),
      },
      {
        id: "gift-edit",
        title: "Gift Edit",
        subtitle: "Easy wins when you want it perfect",
        videoSrc: STYLING_VIDEO,
        posterSrc:
          "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&q=80",
        href: shopHref({ occasion: "festive", collection: "Gifting" }),
      },
      {
        id: "care-calm",
        title: "Care & Calm",
        subtitle: "Make your jewellery last longer",
        videoSrc: STYLING_VIDEO,
        posterSrc:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1200&q=80",
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
            <p className="text-xs tracking-[0.2em] text-primary uppercase">
              Styling
            </p>
            <h2 className="mt-2 font-serif text-4xl text-primary md:text-5xl">
              Styling 101 With Diamonds
            </h2>
            <span className="mx-auto mt-4 block h-px w-12 bg-primary/35" />
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-600 md:text-base">
              Tap a card to open the same layered story design, with video
              playing in the center.
            </p>
          </div>

          <div className="relative mx-auto mt-8 h-[360px] max-w-5xl md:mt-10 md:h-[440px]">
            <StoryCard
              story={prev}
              isActive={false}
              positionClassName="absolute top-1/2 left-0 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[-3deg] md:block lg:left-4 lg:h-[300px] lg:w-[240px]"
              onOpen={openModal}
              onHover={() =>
                setActiveIndex((i) => wrapIndex(i - 1, items.length))
              }
            />

            <div className="absolute top-0 left-1/2 z-10 w-[min(92%,520px)] -translate-x-1/2">
              <StoryCard
                story={active}
                isActive={true}
                positionClassName="relative h-[320px] w-full md:h-[400px]"
                onOpen={openModal}
                onHover={() => {}}
              />
            </div>

            <StoryCard
              story={next}
              isActive={false}
              positionClassName="absolute top-1/2 right-0 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[3deg] md:block lg:right-4 lg:h-[300px] lg:w-[240px]"
              onOpen={openModal}
              onHover={() =>
                setActiveIndex((i) => wrapIndex(i + 1, items.length))
              }
            />

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
              <div className="min-w-0 truncate text-sm text-white/80">
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
              <div className="hidden md:block">
                <StoryCard
                  story={prev}
                  isActive={false}
                  positionClassName="absolute top-1/2 left-0 w-[240px] -translate-y-1/2 rotate-[-4deg]"
                  onOpen={() =>
                    setActiveIndex((i) => wrapIndex(i - 1, items.length))
                  }
                  onHover={() =>
                    setActiveIndex((i) => wrapIndex(i - 1, items.length))
                  }
                />
              </div>

              <div className="relative z-10 w-[92%] max-w-[620px]">
                <div className="relative h-[380px] overflow-hidden rounded-[20px] border border-[#ead9c4]/50 bg-[#faf6f0] md:h-[470px]">
                  <Image
                    src={active.posterSrc}
                    alt={active.title}
                    fill
                    className="object-cover"
                  />
                  <StoryVideo
                    src={active.videoSrc}
                    poster={active.posterSrc}
                    active
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent p-6">
                    <p className="text-xs tracking-[0.2em] text-white/80 uppercase">
                      Style Story
                    </p>
                    <h3 className="mt-2 font-serif text-2xl text-white drop-shadow sm:text-3xl">
                      {active.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-white/85">
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

              <div className="hidden md:block">
                <StoryCard
                  story={next}
                  isActive={false}
                  positionClassName="absolute top-1/2 right-0 w-[240px] -translate-y-1/2 rotate-[4deg]"
                  onOpen={() =>
                    setActiveIndex((i) => wrapIndex(i + 1, items.length))
                  }
                  onHover={() =>
                    setActiveIndex((i) => wrapIndex(i + 1, items.length))
                  }
                />
              </div>

              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute top-1/2 left-1 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="Previous story"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
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

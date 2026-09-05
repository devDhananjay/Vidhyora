"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/content/homepage-defaults";
import { isVideoUrl } from "@/lib/media/is-video-url";
import type { HomepageStyleStory } from "@/lib/validations/homepage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StyleStoriesProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  stories?: HomepageStyleStory[];
};

function wrapIndex(index: number, length: number) {
  return (index % length + length) % length;
}

/** Safari-safe muted autoplay for active card media (image or video). */
function StoryMedia({
  src,
  poster,
  active,
  alt,
}: {
  src: string;
  poster: string;
  active: boolean;
  alt: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoUrl(src);

  useEffect(() => {
    if (!isVideo) return;
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
  }, [src, active, isVideo]);

  if (!isVideo) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", active ? "opacity-100" : "opacity-0")}
        sizes="(max-width: 768px) 90vw, 520px"
        unoptimized={src.startsWith("/uploads/")}
      />
    );
  }

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
  onSelect,
}: {
  story: HomepageStyleStory;
  isActive: boolean;
  positionClassName: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        positionClassName,
        "overflow-hidden rounded-[18px] border border-[#ead9c4]/80 bg-[#faf6f0]",
      )}
      aria-label={`Open style story: ${story.title}`}
    >
      <div className="absolute inset-0">
        <Image
          src={story.poster}
          alt={story.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 90vw, 520px"
          unoptimized={story.poster.startsWith("/uploads/")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
      </div>

      <StoryMedia
        src={story.media}
        poster={story.poster}
        active={isActive}
        alt={story.title}
      />

      <div className="absolute inset-x-0 bottom-0 p-5 text-left">
        <p className="text-xs tracking-[0.2em] text-white/80 uppercase">
          Style Story
        </p>
        <p className="mt-2 font-serif text-2xl text-white drop-shadow">
          {story.title}
        </p>
        <p className="mt-1 text-sm text-white/85">{story.subtitle}</p>
      </div>

      {!isActive && isVideoUrl(story.media) ? (
        <div className="pointer-events-none absolute top-5 left-5 rounded-full border border-white/40 bg-white/90 p-2 text-[#8b2e2e] shadow-sm">
          <Play className="size-5 fill-current" strokeWidth={1.5} />
        </div>
      ) : null}
    </button>
  );
}

export function StyleStories({
  eyebrow = DEFAULT_HOMEPAGE_CONFIG.styleStories.eyebrow,
  title = DEFAULT_HOMEPAGE_CONFIG.styleStories.title,
  subtitle = DEFAULT_HOMEPAGE_CONFIG.styleStories.subtitle,
  stories = DEFAULT_HOMEPAGE_CONFIG.styleStories.stories,
}: StyleStoriesProps) {
  const items = stories.length > 0 ? stories : DEFAULT_HOMEPAGE_CONFIG.styleStories.stories;
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const go = useCallback(
    (delta: number) => {
      setActiveIndex((i) => wrapIndex(i + delta, items.length));
    },
    [items.length],
  );

  const active = items[wrapIndex(activeIndex, items.length)];
  const prev = items[wrapIndex(activeIndex - 1, items.length)];
  const next = items[wrapIndex(activeIndex + 1, items.length)];

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, go]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!active) return null;

  return (
    <>
      <section className="bg-[#faf8f6] py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs tracking-[0.2em] text-primary uppercase">
              {eyebrow}
            </p>
            <h2 className="mt-2 font-serif text-4xl text-primary md:text-5xl">
              {title}
            </h2>
            <span className="mx-auto mt-4 block h-px w-12 bg-primary/35" />
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-600 md:text-base">
              {subtitle}
            </p>
          </div>

          <div className="relative mx-auto mt-8 h-[360px] max-w-5xl md:mt-10 md:h-[440px]">
            <StoryCard
              story={prev}
              isActive={false}
              positionClassName="absolute top-1/2 left-0 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[-3deg] md:block lg:left-4 lg:h-[300px] lg:w-[240px]"
              onSelect={() => {
                go(-1);
                setOpen(true);
              }}
            />

            <div className="absolute top-0 left-1/2 z-10 w-[min(92%,520px)] -translate-x-1/2">
              <StoryCard
                story={active}
                isActive
                positionClassName="relative h-[320px] w-full md:h-[400px]"
                onSelect={() => setOpen(true)}
              />
            </div>

            <StoryCard
              story={next}
              isActive={false}
              positionClassName="absolute top-1/2 right-0 z-[5] hidden h-[280px] w-[220px] -translate-y-1/2 rotate-[3deg] md:block lg:right-4 lg:h-[300px] lg:w-[240px]"
              onSelect={() => {
                go(1);
                setOpen(true);
              }}
            />

            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-full border border-neutral-200 bg-white/90 p-2 shadow-sm"
                aria-label="Previous story"
              >
                <ChevronLeft className="size-5 text-primary" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-full border border-neutral-200 bg-white/90 p-2 shadow-sm"
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
          className="fixed inset-0 z-[100] flex flex-col bg-black/70 p-4 md:p-8"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
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

          <div className="relative mx-auto mt-6 flex w-full max-w-6xl flex-1 items-center justify-center">
            {/* Side previews — pointer-events none on wrapper so nav stays clickable */}
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[240px] items-center md:flex">
              <div className="pointer-events-auto w-full -translate-y-2 rotate-[-4deg]">
                <StoryCard
                  story={prev}
                  isActive={false}
                  positionClassName="relative h-[300px] w-full"
                  onSelect={() => go(-1)}
                />
              </div>
            </div>

            <div className="relative z-10 w-[92%] max-w-[620px]">
              <div className="relative h-[380px] overflow-hidden rounded-[20px] border border-[#ead9c4]/50 bg-[#faf6f0] md:h-[470px]">
                <Image
                  src={active.poster}
                  alt={active.title}
                  fill
                  className="object-cover"
                  unoptimized={active.poster.startsWith("/uploads/")}
                />
                <StoryMedia
                  src={active.media}
                  poster={active.poster}
                  active
                  alt={active.title}
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

            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[240px] items-center justify-end md:flex">
              <div className="pointer-events-auto w-full -translate-y-2 rotate-[4deg]">
                <StoryCard
                  story={next}
                  isActive={false}
                  positionClassName="relative h-[300px] w-full"
                  onSelect={() => go(1)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute top-1/2 left-0 z-50 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#8b2e2e] shadow-lg transition hover:scale-105 md:left-2 md:size-14"
              aria-label="Previous story"
            >
              <ChevronLeft className="size-6" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute top-1/2 right-0 z-50 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#8b2e2e] shadow-lg transition hover:scale-105 md:right-2 md:size-14"
              aria-label="Next story"
            >
              <ChevronRight className="size-6" strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

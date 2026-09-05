"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type WorldBannerVideoProps = {
  src: string;
  className?: string;
  /** When false, video pauses (e.g. inactive hero slide). Default true — always autoplay. */
  active?: boolean;
};

/**
 * Safari-safe banner autoplay:
 * - mute BEFORE assigning src (critical for Safari)
 * - do not pause when off-screen (Safari often refuses to resume)
 * - show tap-to-play if Low Power Mode blocks autoplay
 */
export function WorldBannerVideo({
  src,
  className,
  active = true,
}: WorldBannerVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);

  const tryPlay = useCallback(async () => {
    const el = ref.current;
    if (!el || !active) return false;

    el.defaultMuted = true;
    el.muted = true;
    el.volume = 0;
    el.playsInline = true;

    try {
      await el.play();
      setNeedsTap(false);
      return true;
    } catch {
      setNeedsTap(true);
      return false;
    }
  }, [active]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    // Safari: attributes + properties before src
    el.defaultMuted = true;
    el.muted = true;
    el.volume = 0;
    el.playsInline = true;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("x-webkit-airplay", "deny");

    if (!active) {
      el.pause();
      setNeedsTap(false);
      return;
    }

    // Assign src after mute, then load
    if (el.getAttribute("src") !== src) {
      el.setAttribute("src", src);
    }
    el.load();

    const kick = () => {
      if (!cancelled) void tryPlay();
    };

    el.addEventListener("loadeddata", kick);
    el.addEventListener("canplay", kick);
    el.addEventListener("canplaythrough", kick);

    // First attempt after a tick (hydration)
    const t1 = window.setTimeout(kick, 50);
    const t2 = window.setTimeout(kick, 400);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) kick();
      },
      { threshold: 0.2, rootMargin: "80px" },
    );
    observer.observe(el);

    const onVis = () => {
      if (document.visibilityState === "visible") kick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer.disconnect();
      el.removeEventListener("loadeddata", kick);
      el.removeEventListener("canplay", kick);
      el.removeEventListener("canplaythrough", kick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src, tryPlay, active]);

  return (
    <>
      <video
        ref={ref}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        controls={false}
        // IMPORTANT: no `src` prop — set in effect after mute (Safari)
        aria-hidden
        className={cn("pointer-events-none bg-[#faf6f0]", className)}
      />

      {needsTap ? (
        <button
          type="button"
          aria-label="Play video"
          onClick={() => void tryPlay()}
          className="absolute inset-0 z-20 flex items-center justify-center bg-transparent"
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-[#ead9c4] bg-white/95 text-[#8b2e2e] shadow-[0_8px_24px_rgba(43,26,22,0.12)] backdrop-blur-sm sm:size-14">
            <Play className="size-5 fill-current sm:size-6" strokeWidth={1.5} />
          </span>
        </button>
      ) : null}
    </>
  );
}

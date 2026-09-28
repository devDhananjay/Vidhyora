"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type WorldBannerVideoProps = {
  src: string;
  className?: string;
  /** When false, video pauses (e.g. inactive hero slide). Default true — always autoplay. */
  active?: boolean;
  /** Loop playback. Hero carousel should pass false so `onEnded` can advance slides. */
  loop?: boolean;
  /** Fires when the video finishes (only when loop is false). */
  onEnded?: () => void;
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
  loop = true,
  onEnded,
}: WorldBannerVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

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
    el.loop = loop;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "true");
    el.setAttribute("x-webkit-airplay", "deny");
    if (loop) el.setAttribute("loop", "");
    else el.removeAttribute("loop");

    if (!active) {
      el.pause();
      setNeedsTap(false);
      return;
    }

    // Assign src after mute, then load from start
    if (el.getAttribute("src") !== src) {
      el.setAttribute("src", src);
    }
    try {
      el.currentTime = 0;
    } catch {
      // ignore seek errors before metadata
    }
    el.load();

    const kick = () => {
      if (!cancelled) void tryPlay();
    };

    const handleEnded = () => {
      if (!cancelled) onEndedRef.current?.();
    };

    el.addEventListener("loadeddata", kick);
    el.addEventListener("canplay", kick);
    el.addEventListener("canplaythrough", kick);
    if (!loop) el.addEventListener("ended", handleEnded);

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
      el.removeEventListener("ended", handleEnded);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src, tryPlay, active, loop]);

  return (
    <>
      <video
        ref={ref}
        muted
        autoPlay
        loop={loop}
        playsInline
        preload="auto"
        controls={false}
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

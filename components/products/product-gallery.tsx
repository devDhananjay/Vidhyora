"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Minus,
  Plus,
  Sparkles,
  ZoomIn,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media/is-video-url";

type GalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  kind?: string | null;
  role?: string | null;
  sortOrder?: number | null;
};

type GalleryItem = {
  id: string;
  url: string;
  altText?: string | null;
  kind: "image" | "video";
  role: "PRODUCT" | "ON_MODEL" | "DETAIL";
};

type ProductGalleryProps = {
  name: string;
  thumbnail: string | null;
  images: GalleryImage[];
  videoUrl?: string | null;
  discount?: number;
  jewelleryKind?:
    | "ring"
    | "bangle"
    | "earring"
    | "necklace"
    | "nose"
    | "jewellery";
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function isValidSrc(src: string | null | undefined) {
  return Boolean(src && !src.includes("placeholder"));
}

function buildGallery(params: {
  name: string;
  thumbnail: string | null;
  images: GalleryImage[];
  videoUrl?: string | null;
}): GalleryItem[] {
  const sorted = [...params.images]
    .filter((image) => isValidSrc(image.url))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const fromImages: GalleryItem[] = sorted.map((image) => {
    const isVideo =
      image.kind?.toUpperCase() === "VIDEO" || isVideoUrl(image.url);
    const role =
      image.role === "ON_MODEL" || image.role === "DETAIL"
        ? image.role
        : "PRODUCT";
    return {
      id: image.id,
      url: image.url,
      altText: image.altText,
      kind: isVideo ? "video" : "image",
      role,
    };
  });

  if (
    isValidSrc(params.videoUrl) &&
    params.videoUrl &&
    !fromImages.some((item) => item.url === params.videoUrl)
  ) {
    fromImages.unshift({
      id: "video-legacy",
      url: params.videoUrl,
      altText: `${params.name} video`,
      kind: "video",
      role: "PRODUCT",
    });
  }

  if (
    isValidSrc(params.thumbnail) &&
    params.thumbnail &&
    !fromImages.some((item) => item.url === params.thumbnail)
  ) {
    fromImages.unshift({
      id: "main",
      url: params.thumbnail,
      altText: params.name,
      kind: "image",
      role: "PRODUCT",
    });
  }

  return fromImages.filter(
    (item, index, list) =>
      list.findIndex((entry) => entry.url === item.url) === index,
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function ProductGallery({
  name,
  thumbnail,
  images,
  videoUrl,
  discount = 0,
}: ProductGalleryProps) {
  const gallery = buildGallery({ name, thumbnail, images, videoUrl });
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "ON_MODEL" | "DETAIL">("ALL");
  const [lightbox, setLightbox] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{
    distance: number;
    zoom: number;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const hasOnModel = gallery.some((item) => item.role === "ON_MODEL");
  const hasDetail = gallery.some((item) => item.role === "DETAIL");
  const showFilterChips = hasOnModel || hasDetail;
  const visibleGallery =
    filter === "ALL"
      ? gallery
      : gallery.filter((item) => item.role === filter);
  const filterEmpty = filter !== "ALL" && visibleGallery.length === 0;
  const current = filterEmpty
    ? null
    : visibleGallery[Math.min(active, Math.max(visibleGallery.length - 1, 0))] ||
      null;
  const isVideo = current
    ? current.kind === "video" || isVideoUrl(current.url)
    : false;
  const imageItems = visibleGallery.filter(
    (item) => item.kind === "image" && !isVideoUrl(item.url),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [thumbnail, videoUrl, images, filter]);

  useEffect(() => {
    // If seller removed on-model / detail shots, leave that empty filter.
    if (filter === "ON_MODEL" && !hasOnModel) setFilter("ALL");
    if (filter === "DETAIL" && !hasDetail) setFilter("ALL");
  }, [filter, hasOnModel, hasDetail]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    dragRef.current = null;
    pinchRef.current = null;
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox(false);
    resetZoom();
  }, [resetZoom]);

  function go(delta: number) {
    if (visibleGallery.length < 2) return;
    setActive(
      (currentIndex) =>
        (currentIndex + delta + visibleGallery.length) % visibleGallery.length,
    );
    resetZoom();
  }

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "+" || e.key === "=") bumpZoom(ZOOM_STEP);
      if (e.key === "-" || e.key === "_") bumpZoom(-ZOOM_STEP);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.documentElement.dataset.galleryLightbox = "open";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      delete document.documentElement.dataset.galleryLightbox;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- go/bumpZoom stable enough via state
  }, [lightbox, visibleGallery.length, closeLightbox]);

  function bumpZoom(delta: number, focal?: { x: number; y: number }) {
    setZoom((prev) => {
      const next = clamp(Math.round((prev + delta) * 10) / 10, MIN_ZOOM, MAX_ZOOM);
      if (next === 1) {
        setOffset({ x: 0, y: 0 });
        return next;
      }
      if (focal && stageRef.current) {
        const rect = stageRef.current.getBoundingClientRect();
        const cx = focal.x - rect.left - rect.width / 2;
        const cy = focal.y - rect.top - rect.height / 2;
        const ratio = next / prev;
        setOffset((o) => ({
          x: cx - (cx - o.x) * ratio,
          y: cy - (cy - o.y) * ratio,
        }));
      }
      return next;
    });
  }

  function onStageClick() {
    if (dragRef.current?.moved) return;
    if (zoom > 1) {
      resetZoom();
      return;
    }
    bumpZoom(1);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch" && e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      /* continue */
    }
    if (zoom <= 1 && e.pointerType !== "touch") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || zoom <= 1) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    setOffset({
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) {
      // keep moved flag briefly for click suppression
      window.setTimeout(() => {
        if (dragRef.current?.pointerId === e.pointerId) {
          dragRef.current = null;
        }
      }, 0);
    }
  }

  function onWheel(e: ReactWheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2;
    bumpZoom(delta, { x: e.clientX, y: e.clientY });
  }

  function onTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { distance, zoom };
      dragRef.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = distance / pinchRef.current.distance;
      const next = clamp(
        Math.round(pinchRef.current.zoom * ratio * 10) / 10,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      setZoom(next);
      if (next === 1) setOffset({ x: 0, y: 0 });
    }
  }

  function onTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (e.touches.length < 2) pinchRef.current = null;
  }

  const lightboxNode =
    lightbox && current && !isVideo && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[400] flex flex-col bg-[#1a100e]/92 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Product image zoom"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
              <p className="truncate text-sm font-medium tracking-wide">
                {name}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => bumpZoom(-ZOOM_STEP)}
                  disabled={zoom <= MIN_ZOOM}
                  className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-35"
                  aria-label="Zoom out"
                >
                  <Minus className="size-4" />
                </button>
                <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-white/80">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => bumpZoom(ZOOM_STEP)}
                  disabled={zoom >= MAX_ZOOM}
                  className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 disabled:opacity-35"
                  aria-label="Zoom in"
                >
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="ml-1 flex size-10 items-center justify-center rounded-full bg-white text-[#8b2e2e] shadow"
                  aria-label="Close zoom"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div
              ref={stageRef}
              className={cn(
                "relative mx-auto flex min-h-0 w-full flex-1 touch-none items-center justify-center overflow-hidden px-3 pb-3",
                zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
              )}
              onClick={onStageClick}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- full-res zoom needs native img */}
              <img
                src={current.url}
                alt={current.altText || name}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain transition-transform duration-150 ease-out will-change-transform"
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              />

              {visibleGallery.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(-1);
                    }}
                    className="absolute left-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#8b2e2e] shadow-lg sm:left-6"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(1);
                    }}
                    className="absolute right-3 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#8b2e2e] shadow-lg sm:right-6"
                    aria-label="Next image"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              ) : null}
            </div>

            <p className="pb-2 text-center text-[11px] tracking-wide text-white/55">
              {zoom > 1
                ? "Drag to pan · click or − to reset"
                : "Click / scroll / pinch to zoom into finish & stones"}
            </p>

            {imageItems.length > 0 ? (
              <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5">
                {imageItems.map((item) => {
                  const index = visibleGallery.findIndex((g) => g.id === item.id);
                  const selected = index === active;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (index >= 0) {
                          setActive(index);
                          resetZoom();
                        }
                      }}
                      className={cn(
                        "relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition",
                        selected
                          ? "border-white shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100",
                      )}
                      aria-label={`View ${item.altText || name}`}
                    >
                      <Image
                        src={item.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="space-y-3 lg:sticky lg:top-28">
      {showFilterChips ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              filter === "ALL"
                ? "bg-[#8b2e2e] text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#8b2e2e]/40",
            )}
          >
            All
          </button>
          {hasOnModel ? (
            <button
              type="button"
              onClick={() => setFilter("ON_MODEL")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                filter === "ON_MODEL"
                  ? "bg-[#8b2e2e] text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#8b2e2e]/40",
              )}
            >
              On model
            </button>
          ) : null}
          {hasDetail ? (
            <button
              type="button"
              onClick={() => setFilter("DETAIL")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                filter === "DETAIL"
                  ? "bg-[#8b2e2e] text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:border-[#8b2e2e]/40",
              )}
            >
              Detail
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="group relative aspect-square overflow-hidden rounded-[28px] border border-[#ead9c4]/70 bg-[#f4efea] shadow-[0_20px_50px_rgba(43,26,22,0.08)]">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />

        {filterEmpty ? (
          <div className="relative z-[1] flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-serif text-xl text-neutral-800">
              {filter === "ON_MODEL"
                ? "No on-model photo yet"
                : "No detail shots yet"}
            </p>
            <p className="max-w-xs text-sm text-neutral-500">
              {filter === "ON_MODEL"
                ? "Seller hasn't uploaded a worn shot yet."
                : "Close-up detail photos will appear here when added."}
            </p>
          </div>
        ) : current ? (
          isVideo ? (
            <video
              key={current.url}
              src={current.url}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate noremoteplayback"
              className="relative z-[1] size-full object-cover pointer-events-none"
            />
          ) : (
            <button
              type="button"
              className="absolute inset-0 z-[1] cursor-zoom-in"
              onClick={() => {
                resetZoom();
                setLightbox(true);
              }}
              aria-label="Zoom product image"
            >
              <Image
                key={current.url}
                src={current.url}
                alt={current.altText || name}
                fill
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <span className="absolute bottom-4 right-4 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium tracking-[0.1em] text-[#8b2e2e] uppercase shadow-sm backdrop-blur-sm">
                <ZoomIn className="size-3" strokeWidth={1.8} />
                Zoom
              </span>
            </button>
          )
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-[#f6ebe8] to-[#faf6f0]">
            <span className="font-serif text-3xl tracking-[0.2em] text-[#8b2e2e]/70">
              VIDYORA
            </span>
          </div>
        )}

        {discount > 0 && !filterEmpty ? (
          <span className="absolute left-4 top-4 z-[2] rounded-full bg-[#8b2e2e] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white shadow-md">
            {discount}% OFF
          </span>
        ) : null}

        {!isVideo && current && !filterEmpty ? (
          <span className="absolute bottom-4 left-4 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium tracking-[0.12em] text-[#8b2e2e] uppercase shadow-sm backdrop-blur-sm">
            <Sparkles className="size-3" strokeWidth={1.7} />
            Certified piece
          </span>
        ) : null}

        {visibleGallery.length > 1 && !filterEmpty ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#8b2e2e] shadow-md backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="size-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#8b2e2e] shadow-md backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="size-4" strokeWidth={1.8} />
            </button>
          </>
        ) : null}
      </div>

      {visibleGallery.length > 1 && !filterEmpty ? (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {visibleGallery.slice(0, 6).map((item, index) => {
            const thumbIsVideo = item.kind === "video" || isVideoUrl(item.url);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border bg-[#f4efea] transition duration-300",
                  active === index
                    ? "border-[#8b2e2e] shadow-[0_0_0_1px_rgba(139,46,46,0.25)]"
                    : "border-neutral-100 hover:border-[#8b2e2e]/40",
                )}
                aria-label={
                  thumbIsVideo
                    ? "View product video"
                    : `View image ${index + 1}`
                }
              >
                {thumbIsVideo ? (
                  <div className="flex size-full items-center justify-center bg-neutral-900">
                    <video
                      src={`${item.url}${item.url.includes("#") ? "" : "#t=0.1"}`}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 size-full object-cover opacity-90"
                      onLoadedData={(e) => {
                        const el = e.currentTarget;
                        try {
                          if (el.currentTime < 0.05) el.currentTime = 0.1;
                        } catch {
                          /* ignore */
                        }
                      }}
                    />
                    <span className="relative z-[1] flex size-9 items-center justify-center rounded-full border border-[#8b2e2e]/35 bg-white/95 text-[#8b2e2e] shadow-sm">
                      <Film className="size-4" strokeWidth={1.7} />
                      <span className="sr-only">Video</span>
                    </span>
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.altText || name}
                    fill
                    className="object-cover transition duration-500 hover:scale-105"
                    sizes="20vw"
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {lightboxNode}
    </div>
  );
}

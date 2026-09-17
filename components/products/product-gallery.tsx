"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVideoUrl } from "@/lib/media/is-video-url";

type GalleryImage = {
  id: string;
  url: string;
  altText?: string | null;
  kind?: string | null;
  sortOrder?: number | null;
};

type GalleryItem = {
  id: string;
  url: string;
  altText?: string | null;
  kind: "image" | "video";
};

type ProductGalleryProps = {
  name: string;
  thumbnail: string | null;
  images: GalleryImage[];
  videoUrl?: string | null;
  discount?: number;
};

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
    return {
      id: image.id,
      url: image.url,
      altText: image.altText,
      kind: isVideo ? "video" : "image",
    };
  });

  // Legacy: videoUrl not yet stored as an image row
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
    });
  }

  // Ensure thumbnail appears if missing from images list
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
    });
  }

  return fromImages.filter(
    (item, index, list) =>
      list.findIndex((entry) => entry.url === item.url) === index,
  );
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
  const current = gallery[active];
  const isVideo = current?.kind === "video" || isVideoUrl(current?.url);

  useEffect(() => {
    setActive(0);
  }, [thumbnail, videoUrl, images]);

  function go(delta: number) {
    if (gallery.length < 2) return;
    setActive(
      (currentIndex) =>
        (currentIndex + delta + gallery.length) % gallery.length,
    );
  }

  return (
    <div className="space-y-3 lg:sticky lg:top-28">
      <div className="group relative aspect-square overflow-hidden rounded-[28px] border border-[#ead9c4]/70 bg-[#f4efea] shadow-[0_20px_50px_rgba(43,26,22,0.08)]">
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />

        {current ? (
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
            <Image
              key={current.url}
              src={current.url}
              alt={current.altText || name}
              fill
              className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          )
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-[#f6ebe8] to-[#faf6f0]">
            <span className="font-serif text-3xl tracking-[0.2em] text-[#8b2e2e]/70">
              VIDYORA
            </span>
          </div>
        )}

        {discount > 0 ? (
          <span className="absolute left-4 top-4 z-[2] rounded-full bg-[#8b2e2e] px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white shadow-md">
            {discount}% OFF
          </span>
        ) : null}

        {!isVideo ? (
          <span className="absolute bottom-4 left-4 z-[2] inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium tracking-[0.12em] text-[#8b2e2e] uppercase shadow-sm backdrop-blur-sm">
            <Sparkles className="size-3" strokeWidth={1.7} />
            Certified piece
          </span>
        ) : null}

        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#8b2e2e] opacity-0 shadow-md backdrop-blur transition group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-[2] flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#8b2e2e] opacity-0 shadow-md backdrop-blur transition group-hover:opacity-100"
            >
              <ChevronRight className="size-4" strokeWidth={1.8} />
            </button>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {gallery.slice(0, 6).map((item, index) => {
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
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 size-full object-cover opacity-80"
                    />
                    <span className="relative z-[1] rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                      Video
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
    </div>
  );
}

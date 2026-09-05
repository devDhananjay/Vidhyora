"use client";

import Image from "next/image";
import { isVideoUrl } from "@/lib/media/is-video-url";
import { WorldBannerVideo } from "@/components/storefront/world-banner-video";
import { cn } from "@/lib/utils";

type MediaFillProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  /** When false, renders inline (non-fill) image only — videos still fill parent. */
  fill?: boolean;
  width?: number;
  height?: number;
  /** Videos autoplay when true (default). Pass false for inactive carousel slides. */
  play?: boolean;
};

/**
 * Renders an image or autoplay-muted video to fill a relative parent.
 * Detects type from the URL extension so CMS fields can swap freely.
 */
export function MediaFill({
  src,
  alt,
  className,
  sizes = "100vw",
  priority,
  quality,
  fill = true,
  width,
  height,
  play = true,
}: MediaFillProps) {
  if (isVideoUrl(src)) {
    return (
      <WorldBannerVideo
        src={src}
        active={play}
        className={cn(
          fill && "absolute inset-0 h-full w-full",
          "object-cover",
          className,
        )}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        className={className}
        sizes={sizes}
        unoptimized={src.startsWith("/uploads/")}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 800}
      priority={priority}
      quality={quality}
      className={className}
      sizes={sizes}
      unoptimized={src.startsWith("/uploads/")}
    />
  );
}

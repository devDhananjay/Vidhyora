import { isVideoUrl } from "@/lib/media/is-video-url";

export function isBestSellerFlag(attributes: unknown) {
  if (!attributes || typeof attributes !== "object") return false;
  return (attributes as { bestSeller?: boolean }).bestSeller === true;
}

export function imageUrlsForProduct(input: {
  thumbnail?: string | null;
  images?: { url: string; kind?: string | null }[];
}) {
  const fromImages = (input.images ?? [])
    .filter(
      (image) =>
        image.kind?.toUpperCase() !== "VIDEO" && !isVideoUrl(image.url),
    )
    .map((image) => image.url);

  const thumb =
    input.thumbnail &&
    !isVideoUrl(input.thumbnail) &&
    !input.thumbnail.includes("placeholder")
      ? input.thumbnail
      : null;

  const urls = [thumb, ...fromImages].filter(
    (src): src is string =>
      typeof src === "string" &&
      Boolean(src) &&
      !src.includes("placeholder"),
  );
  return [...new Set(urls)];
}

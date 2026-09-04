export function isBestSellerFlag(attributes: unknown) {
  if (!attributes || typeof attributes !== "object") return false;
  return (attributes as { bestSeller?: boolean }).bestSeller === true;
}

export function imageUrlsForProduct(input: {
  thumbnail?: string | null;
  images?: { url: string }[];
}) {
  const urls = [
    input.thumbnail,
    ...(input.images ?? []).map((image) => image.url),
  ].filter((src): src is string => Boolean(src) && !src.includes("placeholder"));
  return [...new Set(urls)];
}

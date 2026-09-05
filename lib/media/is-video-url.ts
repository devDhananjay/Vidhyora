/** Detect whether a media URL should render as video. */
export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)$/.test(clean);
}

/**
 * Canonical public site origin for SEO (sitemap, robots, structured data).
 * Prefer runtime server env over NEXT_PUBLIC_* (which is inlined at build time).
 * Never emit localhost in production SEO payloads.
 */
export function getSiteUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://vidyora.co.in";

  const cleaned = raw.replace(/\/$/, "");
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleaned)) {
    return "https://vidyora.co.in";
  }
  return cleaned;
}

/**
 * Canonical public site origin for SEO (sitemap, robots, structured data).
 * Prefer runtime server env over NEXT_PUBLIC_* (which is inlined at build time).
 */
export function getSiteUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://vidyora.co.in";

  return raw.replace(/\/$/, "").replace("http://localhost:3000", "https://vidyora.co.in");
}

const PRODUCTION_ORIGIN = "https://vidyora.co.in";

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

function stripLocalhost(origin: string) {
  try {
    const url = new URL(origin);
    if (isLocalHost(url.hostname)) return PRODUCTION_ORIGIN;
    return origin.replace(/\/$/, "");
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

/** App origin for verify/reset links. Localhost is kept only in development. */
export function getEmailAppUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    PRODUCTION_ORIGIN;
  const origin = raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    return stripLocalhost(origin);
  }
  return origin;
}

/**
 * HTTPS origin Gmail can actually fetch. Localhost and http URLs are
 * rewritten so remote images never point at a machine the inbox cannot reach.
 */
export function getPublicEmailOrigin() {
  try {
    const url = new URL(getEmailAppUrl());
    if (isLocalHost(url.hostname)) return PRODUCTION_ORIGIN;
    return `https://${url.host}`;
  } catch {
    return PRODUCTION_ORIGIN;
  }
}

export function emailAssetUrl(path: string) {
  const origin = getPublicEmailOrigin();
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (isLocalHost(url.hostname)) {
        return `${origin}${url.pathname}${url.search}`;
      }
      return path;
    } catch {
      return path;
    }
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function toAbsoluteEmailUrl(url: string) {
  return emailAssetUrl(url.trim() || "/");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

/** Public origin for links inside emails (keeps localhost in development). */
export function getEmailAppUrl() {
  const raw =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://vidyora.co.in";
  return raw.replace(/\/$/, "");
}

export function toAbsoluteEmailUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return getEmailAppUrl();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${getEmailAppUrl()}${path}`;
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

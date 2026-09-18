/** Show the brand navigation loader (skipped automatically for same-URL navigations). */
export function signalNavStart(href?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("vidyora-nav-start", {
      detail: { href },
    }),
  );
}

/**
 * Open mini-cart. Default: auto-closes after a few seconds (Tanishq-style peek).
 * Pass `{ autoCloseMs: 0, fromHover: true }` for bag hover.
 * Pass `{ autoCloseMs: 0, pinned: true }` for bag click (stays until dismiss).
 * Add-to-cart uses the default timed close on both desktop and mobile.
 */
export function openCartDrawer(options?: {
  autoCloseMs?: number;
  pinned?: boolean;
  fromHover?: boolean;
}) {
  if (typeof window === "undefined") return;
  const fromHover = options?.fromHover ?? false;
  const pinned = options?.pinned ?? false;
  const autoCloseMs =
    options?.autoCloseMs ?? (fromHover || pinned ? 0 : 4500);

  window.dispatchEvent(
    new CustomEvent("vidyora-open-cart-drawer", {
      detail: {
        autoCloseMs,
        pinned,
        fromHover,
      },
    }),
  );
}

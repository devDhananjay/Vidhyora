/**
 * Open mini-cart. Default: auto-closes after a few seconds (Tanishq-style).
 * Pass `{ autoCloseMs: 0, fromHover: true }` for bag hover.
 * Pass `{ autoCloseMs: 0, pinned: true }` for bag click (stays until dismiss).
 */
export function openCartDrawer(options?: {
  autoCloseMs?: number;
  pinned?: boolean;
  fromHover?: boolean;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("vidyora-open-cart-drawer", {
      detail: {
        autoCloseMs: options?.autoCloseMs ?? 4500,
        pinned: options?.pinned ?? false,
        fromHover: options?.fromHover ?? false,
      },
    }),
  );
}

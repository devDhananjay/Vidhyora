/**
 * Open mini-wishlist. Pass `{ fromHover: true }` for heart hover.
 * Pass `{ pinned: true }` to keep open until dismiss.
 */
export function openWishlistDrawer(options?: {
  autoCloseMs?: number;
  pinned?: boolean;
  fromHover?: boolean;
}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("vidyora-open-wishlist-drawer", {
      detail: {
        autoCloseMs: options?.autoCloseMs ?? 4500,
        pinned: options?.pinned ?? false,
        fromHover: options?.fromHover ?? false,
      },
    }),
  );
}

export function closeWishlistDrawer() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vidyora-close-wishlist-drawer"));
}

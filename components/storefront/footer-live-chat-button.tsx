"use client";

export function FooterLiveChatButton() {
  return (
    <button
      type="button"
      aria-label="Live chat"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("vidyora:open-support-chat"));
      }}
      className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 fill-current"
        aria-hidden
      >
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" />
      </svg>
    </button>
  );
}

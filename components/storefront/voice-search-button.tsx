"use client";

import { cn } from "@/lib/utils";

type VoiceSearchButtonProps = {
  supported: boolean;
  listening: boolean;
  onToggle: () => void;
  className?: string;
  size?: "sm" | "md";
};

export function VoiceSearchButton({
  supported,
  listening,
  onToggle,
  className,
  size = "sm",
}: VoiceSearchButtonProps) {
  if (!supported) return null;

  const dim = size === "md" ? "size-10" : "size-9";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={listening ? "Stop voice search" : "Search with voice"}
      aria-pressed={listening}
      title={listening ? "Listening… tap to stop" : "Voice search"}
      className={cn(
        "mt-[5px] inline-flex shrink-0 items-center justify-center rounded-full transition",
        listening && "bg-brand/10",
        dim,
        className,
      )}
    >
      <img
        src="/brand/voice-search-icon.png"
        alt=""
        draggable={false}
        className={cn(
          "size-[98%] object-contain",
          listening && "animate-pulse",
        )}
      />
    </button>
  );
}

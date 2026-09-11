import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type NativeSelectProps = React.ComponentProps<"select"> & {
  /** Soft pill (default) or rectangular rounded panel */
  shape?: "pill" | "box";
  wrapperClassName?: string;
};

/**
 * Native &lt;select&gt; with appearance reset so border-radius actually shows
 * (Safari / Chrome otherwise keep the OS chrome square).
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, shape = "pill", wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full min-w-0", wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full cursor-pointer appearance-none border border-input bg-white py-2 pl-4 pr-10 text-sm text-foreground outline-none transition",
            "focus:border-[#8b2e2e] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            shape === "pill" ? "rounded-full" : "rounded-xl",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-neutral-500"
          strokeWidth={1.8}
          aria-hidden
        />
      </div>
    );
  },
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };

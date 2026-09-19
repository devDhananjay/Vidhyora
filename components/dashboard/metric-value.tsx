import { cn } from "@/lib/utils";

/** Dashboard headline numbers — brand maroon, same style as Seller Admin StatCard. */
export const METRIC_VALUE_CLASS =
  "font-serif text-3xl tracking-tight text-brand";

export function MetricValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(METRIC_VALUE_CLASS, className)}>{children}</div>;
}

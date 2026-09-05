import Link from "next/link";
import { ChevronRight } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={item.href} className="flex min-w-0 items-center gap-2">
          {index > 0 && <ChevronRight className="size-4 shrink-0" />}
          {index === items.length - 1 ? (
            <span className="max-w-[min(100%,18rem)] truncate font-medium text-foreground sm:max-w-md">
              {item.label}
            </span>
          ) : (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

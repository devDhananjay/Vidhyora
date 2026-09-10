type BarItem = {
  label: string;
  value: number;
  display?: string;
};

export function HorizontalBarChart({
  items,
  accent = "#8b2e2e",
}: {
  items: BarItem[];
  accent?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No data yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = Math.max(4, Math.round((item.value / max) * 100));
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-neutral-700">{item.label}</span>
              <span className="shrink-0 font-medium text-neutral-900">
                {item.display ?? item.value}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full transition-[width]"
                style={{ width: `${width}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

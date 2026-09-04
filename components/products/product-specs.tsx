export function ProductSpecs({
  attributes,
}: {
  attributes: Record<string, string>;
}) {
  const entries = Object.entries(attributes);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-6 md:p-8">
      <h2 className="mb-4 font-serif text-2xl text-[#8b2e2e]">Specifications</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between gap-4 border-b border-neutral-100 pb-3"
          >
            <span className="text-sm font-medium capitalize text-neutral-800">
              {key}
            </span>
            <span className="text-sm text-neutral-500">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

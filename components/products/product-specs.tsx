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
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-bold">Specifications</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex justify-between border-b pb-3">
            <span className="font-medium capitalize">{key}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

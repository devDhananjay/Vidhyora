export default function CartLoading() {
  return (
    <div className="container mx-auto animate-pulse px-4 py-8">
      <div className="mb-6 h-10 w-56 rounded-lg bg-neutral-100" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-28 rounded-2xl bg-neutral-100" />
          <div className="h-28 rounded-2xl bg-neutral-100" />
        </div>
        <div className="h-64 rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}

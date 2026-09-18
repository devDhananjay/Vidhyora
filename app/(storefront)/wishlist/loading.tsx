export default function WishlistLoading() {
  return (
    <div className="container mx-auto animate-pulse px-4 py-8">
      <div className="mb-6 h-10 w-48 rounded-lg bg-neutral-100" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="aspect-square rounded-2xl bg-neutral-100" />
        <div className="aspect-square rounded-2xl bg-neutral-100" />
        <div className="aspect-square rounded-2xl bg-neutral-100" />
      </div>
    </div>
  );
}

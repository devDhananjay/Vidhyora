import type { ReactNode } from "react";

export function ContentPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-[#faf8f6]">
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-neutral-900 md:text-5xl">
          {title}
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-700">
          {children}
        </div>
      </article>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import {
  getHelpCategories,
  getPublicHelpArticles,
} from "@/actions/content/get-help";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Help & FAQs | VIDYORA",
  description: "Answers about orders, payments, returns, jewellery care and stores.",
};

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category?.trim() || undefined;
  const q = params.q?.trim() || undefined;
  const [articles, categories] = await Promise.all([
    getPublicHelpArticles({ category, q }),
    getHelpCategories(),
  ]);

  const grouped = articles.reduce<Record<string, typeof articles>>((acc, article) => {
    acc[article.category] ??= [];
    acc[article.category].push(article);
    return acc;
  }, {});

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">Support</p>
        <h1 className="mt-2 font-serif text-4xl text-neutral-900 md:text-5xl">Help</h1>
        <p className="mt-3 text-neutral-600">
          Search live FAQs. Super Admin can add or update answers anytime.
        </p>

        <form className="mt-8 flex flex-col gap-3 sm:flex-row" action="/help">
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search orders, returns, COD, jewellery care..."
            className="h-11 bg-white"
          />
          <Button type="submit" className="h-11">
            Search
          </Button>
        </form>

        {categories.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <CategoryChip href="/help" label="All" active={!category} />
            {categories.map((item) => (
              <CategoryChip
                key={item}
                href={`/help?category=${encodeURIComponent(item)}`}
                label={item}
                active={category === item}
              />
            ))}
          </div>
        ) : null}

        {articles.length === 0 ? (
          <div className="mt-10 rounded-lg border bg-white p-10 text-center text-neutral-500">
            No matching help articles. Try another search or category.
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {Object.entries(grouped).map(([group, items]) => (
              <section key={group}>
                <h2 className="font-serif text-2xl text-neutral-900">{group}</h2>
                <div className="mt-4 divide-y rounded-lg border bg-white">
                  {items.map((article) => (
                    <details key={article.id} className="group px-5 py-4">
                      <summary className="cursor-pointer list-none font-medium text-neutral-900 marker:content-none">
                        <span className="flex items-center justify-between gap-4">
                          {article.question}
                          <span className="text-[#8b2e2e] group-open:rotate-45">+</span>
                        </span>
                      </summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-600">
                        {article.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-lg border border-[#8b2e2e]/15 bg-white p-6">
          <h2 className="font-serif text-2xl">Still need help?</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Our jewellery advisors are available on call and email.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a href="tel:1800-123-4567" className="inline-flex items-center gap-2 hover:text-[#8b2e2e]">
              <Phone className="size-4" />
              1800-123-4567
            </a>
            <a
              href="mailto:support@vidyora.com"
              className="inline-flex items-center gap-2 hover:text-[#8b2e2e]"
            >
              <Mail className="size-4" />
              support@vidyora.com
            </a>
            <Link href="/store-locator" className="hover:text-[#8b2e2e]">
              Find a store →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm ${
        active
          ? "bg-[#8b2e2e] text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:border-[#8b2e2e]"
      }`}
    >
      {label}
    </Link>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BLOG_POSTS } from "@/lib/content/blog-posts";

export const metadata: Metadata = {
  title: "Blog | VIDYORA",
  description:
    "Guides on gold, diamonds, gifting and jewellery care from VIDYORA.",
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          Journal
        </p>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900 sm:text-4xl md:text-5xl">
          Blog
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Practical notes on choosing, gifting and looking after gold and
          diamond jewellery — written for how Indian families actually wear it.
        </p>

        {featured ? (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-10 grid overflow-hidden rounded-2xl border border-neutral-100 bg-white md:grid-cols-2"
          >
            <div className="relative min-h-[280px]">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <p className="text-xs tracking-[0.18em] text-[#8b2e2e] uppercase">
                {featured.category} · {featured.readMinutes} min read
              </p>
              <h2 className="mt-3 font-serif text-3xl text-neutral-900">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {featured.excerpt}
              </p>
              <span className="mt-6 text-sm text-[#8b2e2e]">Read article →</span>
            </div>
          </Link>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group overflow-hidden rounded-2xl border border-neutral-100 bg-white"
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <p className="text-xs tracking-[0.18em] text-[#8b2e2e] uppercase">
                  {post.category} · {post.date}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-neutral-900">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

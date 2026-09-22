import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getBlogPostBySlug,
  getBlogPosts,
} from "@/lib/content/get-blog-posts";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { generateArticleStructuredData } from "@/lib/structured-data";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  return {
    title: `${post.title} | VIDYORA Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      images: post.image ? [post.image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const posts = await getBlogPosts();
  const post = posts.find((item) => item.slug === slug);
  if (!post) notFound();

  const more = posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vidyora.co.in";
  const articleLd = generateArticleStructuredData({
    title: post.title,
    description: post.excerpt,
    url: `${appUrl}/blog/${post.slug}`,
    image: post.image,
    datePublished: post.date,
  });

  return (
    <div className="bg-[#faf8f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <article className="mx-auto max-w-3xl px-4 py-14 md:px-6">
        <Link
          href={ROUTES.blog}
          className="text-sm text-[#8b2e2e] hover:underline"
        >
          ← All articles
        </Link>
        <p className="mt-6 text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
          {post.category} · {post.date} · {post.readMinutes} min
        </p>
        <h1 className="mt-3 font-serif text-3xl text-neutral-900 sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-7 text-neutral-600">{post.excerpt}</p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="mt-8 space-y-5 text-[15px] leading-7 text-neutral-700">
          {post.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        {post.tips && post.tips.length > 0 ? (
          <div className="mt-8 rounded-2xl border border-neutral-100 bg-white p-6">
            <h2 className="font-serif text-2xl text-brand">Keep in mind</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-700">
              {post.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {post.shopHref ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-[#ead9c4] bg-gradient-to-br from-[#faf6f0] to-white p-6 sm:p-8">
            <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
              Shop the look
            </p>
            <h2 className="mt-2 font-serif text-2xl text-brand sm:text-3xl">
              Ready to explore this jewellery?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
              Browse curated pieces on VIDYORA — hallmarked, seller-approved, and
              ready to ship.
            </p>
            <Button asChild className="mt-6 rounded-full px-7">
              <Link href={post.shopHref} className="inline-flex items-center gap-2">
                {post.shopLabel ?? "Shop now"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </article>

      {more.length > 0 ? (
        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          <h2 className="font-serif text-2xl text-brand">More to read</h2>
          <ul className="mt-4 space-y-3">
            {more.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/blog/${item.slug}`}
                  className="text-[#8b2e2e] hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

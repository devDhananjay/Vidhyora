import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPost } from "@/lib/content/blog-posts";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Article | VIDYORA" };
  return {
    title: `${post.title} | VIDYORA Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const more = BLOG_POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <div className="bg-[#faf8f6]">
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
        <h1 className="mt-3 font-serif text-4xl text-neutral-900 md:text-5xl">
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
            <h2 className="font-serif text-2xl text-neutral-900">Keep in mind</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-700">
              {post.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {post.shopHref ? (
          <div className="mt-8">
            <Button asChild className="rounded-full px-6">
              <Link href={post.shopHref}>{post.shopLabel ?? "Shop"}</Link>
            </Button>
          </div>
        ) : null}
      </article>

      {more.length > 0 ? (
        <div className="mx-auto max-w-3xl px-4 pb-16 md:px-6">
          <h2 className="font-serif text-2xl text-neutral-900">More to read</h2>
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

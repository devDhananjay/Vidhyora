import prisma from "@/lib/prisma";
import { BLOG_POSTS, type BlogPost } from "@/lib/content/blog-posts";

export const BLOG_CONFIG_ID = "default";

function isBlogPost(value: unknown): value is BlogPost {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.slug === "string" &&
    typeof post.title === "string" &&
    typeof post.excerpt === "string" &&
    Array.isArray(post.paragraphs)
  );
}

function normalizePosts(raw: unknown): BlogPost[] | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const posts = Array.isArray(data) ? data : data.posts;
  if (!Array.isArray(posts) || posts.length === 0) return null;
  const valid = posts.filter(isBlogPost).map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category || "Guides",
    date: post.date || "",
    readMinutes: Number(post.readMinutes) || 5,
    image: post.image || BLOG_POSTS[0]?.image || "",
    shopLabel: post.shopLabel,
    shopHref: post.shopHref,
    paragraphs: post.paragraphs.map(String),
    tips: Array.isArray(post.tips) ? post.tips.map(String) : undefined,
  }));
  return valid.length > 0 ? valid : null;
}

/** Load CMS blog posts, or fall back to hardcoded BLOG_POSTS. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const row = await prisma.blogConfig.findUnique({
      where: { id: BLOG_CONFIG_ID },
    });
    if (!row) return BLOG_POSTS;
    return normalizePosts(row.data) ?? BLOG_POSTS;
  } catch (error) {
    console.error("getBlogPosts error:", error);
    return BLOG_POSTS;
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug);
}

export async function getBlogConfigForAdmin(): Promise<{
  posts: BlogPost[];
  updatedAt: Date | null;
  source: "database" | "default";
}> {
  try {
    const row = await prisma.blogConfig.findUnique({
      where: { id: BLOG_CONFIG_ID },
    });
    if (!row) {
      return { posts: BLOG_POSTS, updatedAt: null, source: "default" };
    }
    const posts = normalizePosts(row.data);
    if (!posts) {
      return { posts: BLOG_POSTS, updatedAt: row.updatedAt, source: "default" };
    }
    return { posts, updatedAt: row.updatedAt, source: "database" };
  } catch (error) {
    console.error("getBlogConfigForAdmin error:", error);
    return { posts: BLOG_POSTS, updatedAt: null, source: "default" };
  }
}

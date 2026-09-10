"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import {
  BLOG_CONFIG_ID,
  getBlogConfigForAdmin,
} from "@/lib/content/get-blog-posts";
import { BLOG_POSTS } from "@/lib/content/blog-posts";
import type { ActionResult } from "@/lib/utils";

const blogPostSchema = z.object({
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  category: z.string().min(1).max(80).default("Guides"),
  date: z.string().max(80).default(""),
  readMinutes: z.coerce.number().int().min(1).max(60).default(5),
  image: z.string().min(1).max(500),
  shopLabel: z.string().max(80).optional(),
  shopHref: z.string().max(200).optional(),
  paragraphs: z.array(z.string().min(1)).min(1),
  tips: z.array(z.string()).optional(),
});

const blogConfigSchema = z.object({
  posts: z.array(blogPostSchema).min(1),
});

export async function loadBlogAdmin(): Promise<
  ActionResult<{
    posts: z.infer<typeof blogPostSchema>[];
    updatedAt: string | null;
    source: "database" | "default";
  }>
> {
  try {
    await requireSuperAdmin();
    const result = await getBlogConfigForAdmin();
    return {
      success: true,
      data: {
        posts: result.posts,
        updatedAt: result.updatedAt?.toISOString() ?? null,
        source: result.source,
      },
    };
  } catch (error) {
    console.error("loadBlogAdmin error:", error);
    return { success: false, error: "Failed to load blog" };
  }
}

export async function saveBlogConfig(
  raw: unknown,
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const session = await requireSuperAdmin();
    const parsed = blogConfigSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid blog data",
      };
    }

    const row = await prisma.blogConfig.upsert({
      where: { id: BLOG_CONFIG_ID },
      create: {
        id: BLOG_CONFIG_ID,
        data: { posts: parsed.data.posts },
        updatedBy: session.user.id,
      },
      update: {
        data: { posts: parsed.data.posts },
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    for (const post of parsed.data.posts) {
      revalidatePath(`/blog/${post.slug}`);
    }

    return {
      success: true,
      data: { updatedAt: row.updatedAt.toISOString() },
    };
  } catch (error) {
    console.error("saveBlogConfig error:", error);
    return { success: false, error: "Failed to save blog" };
  }
}

export async function resetBlogConfig(): Promise<
  ActionResult<{ posts: typeof BLOG_POSTS }>
> {
  try {
    const session = await requireSuperAdmin();
    await prisma.blogConfig.upsert({
      where: { id: BLOG_CONFIG_ID },
      create: {
        id: BLOG_CONFIG_ID,
        data: { posts: BLOG_POSTS },
        updatedBy: session.user.id,
      },
      update: {
        data: { posts: BLOG_POSTS },
        updatedBy: session.user.id,
      },
    });
    revalidatePath("/blog");
    revalidatePath("/admin/blog");
    return { success: true, data: { posts: BLOG_POSTS } };
  } catch (error) {
    console.error("resetBlogConfig error:", error);
    return { success: false, error: "Failed to reset blog" };
  }
}

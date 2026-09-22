import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBlogConfigForAdmin } from "@/lib/content/get-blog-posts";
import { requireSuperAdmin } from "@/lib/auth-helpers";
import { BlogEditor } from "@/components/admin/blog-editor";

export const metadata: Metadata = {
  title: "Blog | Admin",
};

export default async function AdminBlogPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/admin");
  }
  const { posts, source } = await getBlogConfigForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">Blog</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Edit storefront journal posts. Empty CMS falls back to built-in
          articles.
        </p>
      </div>
      <BlogEditor initialPosts={posts} source={source} />
    </div>
  );
}

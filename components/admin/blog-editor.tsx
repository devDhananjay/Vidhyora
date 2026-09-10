"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { saveBlogConfig, resetBlogConfig } from "@/actions/admin/manage-blog";
import type { BlogPost } from "@/lib/content/blog-posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";

type BlogEditorProps = {
  initialPosts: BlogPost[];
  source: "database" | "default";
};

function emptyPost(): BlogPost {
  return {
    slug: "",
    title: "",
    excerpt: "",
    category: "Guides",
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    readMinutes: 5,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1400&q=80",
    paragraphs: [""],
    tips: [],
  };
}

export function BlogEditor({ initialPosts, source }: BlogEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const updatePost = (index: number, patch: Partial<BlogPost>) => {
    setPosts((prev) =>
      prev.map((post, i) => (i === index ? { ...post, ...patch } : post)),
    );
  };

  const handleSave = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveBlogConfig({ posts });
      if (result.success) {
        setMessage("Blog saved.");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Source: {source === "database" ? "Saved CMS" : "Default hardcoded posts"}
      </p>

      {posts.map((post, index) => (
        <Card key={`${post.slug}-${index}`}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle className="font-serif text-xl">
              Post {index + 1}
              {post.title ? `: ${post.title}` : ""}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() =>
                setPosts((prev) => prev.filter((_, i) => i !== index))
              }
              disabled={posts.length <= 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  className="rounded-full"
                  value={post.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    updatePost(index, {
                      title,
                      slug: post.slug || slugify(title),
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  className="rounded-full"
                  value={post.slug}
                  onChange={(e) => updatePost(index, { slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  className="rounded-full"
                  value={post.category}
                  onChange={(e) =>
                    updatePost(index, { category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date label</Label>
                <Input
                  className="rounded-full"
                  value={post.date}
                  onChange={(e) => updatePost(index, { date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Read minutes</Label>
                <Input
                  type="number"
                  className="rounded-full"
                  value={post.readMinutes}
                  onChange={(e) =>
                    updatePost(index, {
                      readMinutes: Number(e.target.value) || 5,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  className="rounded-full"
                  value={post.image}
                  onChange={(e) => updatePost(index, { image: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                className="rounded-2xl"
                rows={2}
                value={post.excerpt}
                onChange={(e) => updatePost(index, { excerpt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Paragraphs (one per line block, separated by blank line)</Label>
              <Textarea
                className="rounded-2xl font-mono text-sm"
                rows={8}
                value={post.paragraphs.join("\n\n")}
                onChange={(e) =>
                  updatePost(index, {
                    paragraphs: e.target.value
                      .split(/\n\s*\n/)
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tips (optional, one per line)</Label>
              <Textarea
                className="rounded-2xl"
                rows={3}
                value={(post.tips ?? []).join("\n")}
                onChange={(e) =>
                  updatePost(index, {
                    tips: e.target.value
                      .split("\n")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setPosts((prev) => [...prev, emptyPost()])}
        >
          <Plus className="mr-2 size-4" />
          Add post
        </Button>
        <Button
          type="button"
          className="rounded-full bg-[#8b2e2e] hover:bg-[#6f2424]"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? "Saving..." : "Save blog"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await resetBlogConfig();
              if (result.success) {
                setPosts(result.data.posts);
                setMessage("Reset to defaults.");
                router.refresh();
              } else {
                setError(result.error);
              }
            })
          }
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}

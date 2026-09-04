"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createHelpArticle,
  updateHelpArticle,
} from "@/actions/admin/manage-help";
import {
  HELP_CATEGORIES,
  type HelpArticleInput,
} from "@/lib/validations/content";

type HelpArticleFormProps = {
  article?: HelpArticleInput & { id: string };
  onSaved?: () => void;
};

export function HelpArticleForm({ article, onSaved }: HelpArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const payload: HelpArticleInput = {
      category: String(formData.get("category") ?? "Orders") as HelpArticleInput["category"],
      question: String(formData.get("question") ?? ""),
      answer: String(formData.get("answer") ?? ""),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") || 0),
    };

    startTransition(async () => {
      const result = article
        ? await updateHelpArticle(article.id, payload)
        : await createHelpArticle(payload);
      if (result.success) {
        onSaved?.();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={article?.category ?? "Orders"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {HELP_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={article?.sortOrder ?? 0}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
        <Input id="question" name="question" defaultValue={article?.question} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer">Answer</Label>
        <Textarea
          id="answer"
          name="answer"
          className="min-h-28"
          defaultValue={article?.answer}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={article?.isActive ?? true}
        />
        Visible on Help page
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : article ? "Save article" : "Add FAQ"}
        </Button>
      </div>
    </form>
  );
}

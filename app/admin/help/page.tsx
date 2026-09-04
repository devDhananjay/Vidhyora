import type { Metadata } from "next";
import { getAdminHelpArticles } from "@/actions/admin/manage-help";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpArticleForm } from "@/components/admin/help-article-form";
import { HelpRowActions } from "@/components/admin/help-row-actions";

export const metadata: Metadata = {
  title: "Help | Super Admin",
};

export default async function AdminHelpPage() {
  const articles = await getAdminHelpArticles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Help & FAQs</h1>
        <p className="mt-2 text-muted-foreground">
          Questions listed here appear on the public Help page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add an FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <HelpArticleForm />
        </CardContent>
      </Card>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No FAQs yet. Add the first question above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{article.category}</Badge>
                    <Badge variant={article.isActive ? "default" : "secondary"}>
                      {article.isActive ? "Live" : "Hidden"}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{article.question}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {article.answer}
                  </p>
                </div>
                <HelpRowActions
                  article={{
                    id: article.id,
                    category: article.category as
                      | "Orders"
                      | "Payments"
                      | "Returns"
                      | "Jewellery Care"
                      | "Stores"
                      | "Account",
                    question: article.question,
                    answer: article.answer,
                    isActive: article.isActive,
                    sortOrder: article.sortOrder,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

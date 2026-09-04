"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  helpArticleSchema,
  type HelpArticleInput,
} from "@/lib/validations/content";
import type { ActionResult } from "@/lib/utils";

function revalidateHelp() {
  revalidatePath("/help");
  revalidatePath("/admin/help");
}

export async function getAdminHelpArticles() {
  await requireAdmin();
  return prisma.helpArticle.findMany({
    orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { question: "asc" }],
  });
}

export async function createHelpArticle(
  data: HelpArticleInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = helpArticleSchema.parse(data);

    const article = await prisma.helpArticle.create({ data: validated });
    revalidateHelp();
    return { success: true, data: { id: article.id } };
  } catch (error) {
    console.error("Create help article error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create article",
    };
  }
}

export async function updateHelpArticle(
  id: string,
  data: HelpArticleInput,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = helpArticleSchema.parse(data);

    await prisma.helpArticle.update({
      where: { id },
      data: validated,
    });

    revalidateHelp();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update help article error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update article",
    };
  }
}

export async function toggleHelpArticleStatus(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const article = await prisma.helpArticle.findUnique({ where: { id } });
    if (!article) return { success: false, error: "Article not found" };

    await prisma.helpArticle.update({
      where: { id },
      data: { isActive: !article.isActive },
    });

    revalidateHelp();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Toggle help article error:", error);
    return { success: false, error: "Failed to update article" };
  }
}

export async function deleteHelpArticle(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    await prisma.helpArticle.delete({ where: { id } });
    revalidateHelp();
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete help article error:", error);
    return { success: false, error: "Failed to delete article" };
  }
}

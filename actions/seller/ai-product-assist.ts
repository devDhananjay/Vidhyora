"use server";

import { getActingSeller } from "@/lib/seller-context";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";
import { loadProductImageForAi } from "@/lib/ai/load-product-image";
import {
  analyzeJewelleryProduct,
  isAiConfigured,
  refineJewelleryProductDraft,
} from "@/lib/ai/product-vision";
import { assertAiRateLimit } from "@/lib/ai/rate-limit";
import {
  analyzeProductImageInputSchema,
  refineProductDraftInputSchema,
  type AiProductDraft,
} from "@/lib/validations/ai-product-draft";

export type AiAssistResult = {
  draft: AiProductDraft;
  assistantMessage: string;
  configured: boolean;
};

function resolveImageUrls(input: {
  imageUrl?: string;
  imageUrls?: string[];
}): string[] {
  const urls = [
    ...(input.imageUrls || []),
    ...(input.imageUrl ? [input.imageUrl] : []),
  ].filter(Boolean);
  return [...new Set(urls)].slice(0, 3);
}

export async function getAiProductAssistStatus(): Promise<
  ActionResult<{ configured: boolean }>
> {
  return actionSuccess({ configured: isAiConfigured() });
}

export async function analyzeProductImageForListing(
  input: unknown,
): Promise<ActionResult<AiAssistResult>> {
  try {
    const acting = await getActingSeller();
    if (!acting) return actionError("Seller profile not found");

    if (!isAiConfigured()) {
      return actionError(
        "AI is not configured on the server. Ask admin to set GEMINI_BLOG_API_KEY or GEMINI_API_KEY.",
      );
    }

    assertAiRateLimit(acting.sellerUserId);

    const parsed = analyzeProductImageInputSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid request for AI analysis");
    }

    const urls = resolveImageUrls(parsed.data);
    if (urls.length === 0) {
      return actionError("Upload at least one product image");
    }

    const images = await Promise.all(
      urls.map((url) => loadProductImageForAi(url, acting.sellerUserId)),
    );

    const result = await analyzeJewelleryProduct({
      images,
      categories: parsed.data.categories,
    });

    return actionSuccess({
      draft: result.draft,
      assistantMessage: result.assistantMessage,
      configured: true,
    });
  } catch (error) {
    console.error("analyzeProductImageForListing error:", error);
    return actionError(
      error instanceof Error ? error.message : "AI analysis failed",
    );
  }
}

export async function refineProductListingDraft(
  input: unknown,
): Promise<ActionResult<AiAssistResult>> {
  try {
    const acting = await getActingSeller();
    if (!acting) return actionError("Seller profile not found");

    if (!isAiConfigured()) {
      return actionError(
        "AI is not configured on the server. Ask admin to set GEMINI_BLOG_API_KEY or GEMINI_API_KEY.",
      );
    }

    assertAiRateLimit(acting.sellerUserId);

    const parsed = refineProductDraftInputSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid chat request");
    }

    const urls = resolveImageUrls(parsed.data);
    const images = [];
    for (const url of urls) {
      try {
        images.push(await loadProductImageForAi(url, acting.sellerUserId));
      } catch {
        /* skip unreadable */
      }
    }

    const result = await refineJewelleryProductDraft({
      images: images.length ? images : undefined,
      draft: parsed.data.draft,
      categories: parsed.data.categories,
      history: parsed.data.messages,
      userMessage: parsed.data.userMessage,
    });

    return actionSuccess({
      draft: result.draft,
      assistantMessage: result.assistantMessage,
      configured: true,
    });
  } catch (error) {
    console.error("refineProductListingDraft error:", error);
    return actionError(
      error instanceof Error ? error.message : "AI chat failed",
    );
  }
}

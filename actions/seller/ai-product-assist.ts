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
        "AI is not configured on the server. Ask admin to set OPENAI_API_KEY or GEMINI_API_KEY.",
      );
    }

    assertAiRateLimit(acting.sellerUserId);

    const parsed = analyzeProductImageInputSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid request for AI analysis");
    }

    const image = await loadProductImageForAi(
      parsed.data.imageUrl,
      acting.sellerUserId,
    );

    const result = await analyzeJewelleryProduct({
      image,
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
        "AI is not configured on the server. Ask admin to set OPENAI_API_KEY or GEMINI_API_KEY.",
      );
    }

    assertAiRateLimit(acting.sellerUserId);

    const parsed = refineProductDraftInputSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Invalid chat request");
    }

    let image;
    if (parsed.data.imageUrl) {
      try {
        image = await loadProductImageForAi(
          parsed.data.imageUrl,
          acting.sellerUserId,
        );
      } catch {
        image = undefined;
      }
    }

    const result = await refineJewelleryProductDraft({
      image,
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

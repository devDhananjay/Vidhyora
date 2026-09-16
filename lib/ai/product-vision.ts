import {
  aiProductDraftSchema,
  type AiChatMessage,
  type AiProductDraft,
} from "@/lib/validations/ai-product-draft";
import type { ImagePayload } from "@/lib/ai/load-product-image";

type CategoryOption = { id: string; name: string; slug?: string };

function getProvider(): "openai" | "gemini" {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "openai" || forced === "gemini") return forced;
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  throw new Error(
    "AI is not configured. Set OPENAI_API_KEY or GEMINI_API_KEY on the server.",
  );
}

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("AI returned invalid JSON");
  }
}

function buildSystemPrompt(categories: CategoryOption[]) {
  const categoryLines = categories
    .map((c) => `- ${c.name} (id: ${c.id}${c.slug ? `, slug: ${c.slug}` : ""})`)
    .join("\n");

  return `You are a jewellery product listing assistant for VIDYORA, an Indian jewellery marketplace.
Analyze product photos and help sellers create accurate listings.

Rules:
- Write in clear English suitable for Indian shoppers.
- Prefer warm, premium jewellery language (metal, stones, occasion, craftsmanship).
- shortDescription: 20–500 characters, one concise marketing line.
- description: 50–5000 characters, 2–4 short paragraphs of product details.
- Pick categoryId ONLY from this list (use the exact id). If unsure, pick the closest and set confidence lower, and add a question.
Categories:
${categoryLines || "(none provided)"}

Always respond with ONE JSON object only (no markdown), matching this shape:
{
  "name": string,
  "brand": string | null,
  "categoryId": string | null,
  "categoryName": string | null,
  "shortDescription": string,
  "description": string,
  "suggestedPrice": number | null,
  "compareAtPrice": number | null,
  "stock": number | null,
  "sku": string | null,
  "variantLabel": string | null,
  "makingChargePercent": string | null,
  "metalRatePerGram": string | null,
  "hsn": string | null,
  "certificateNumber": string | null,
  "imageAltText": string | null,
  "attributes": object | null,
  "confidence": number,
  "questions": string[],
  "assistantMessage": string
}

assistantMessage should be a short friendly chat message summarizing what you filled and asking for any missing essentials (price, stock, category confirm).
Do NOT invent certificate numbers. Leave price/stock null if unknown — ask in questions/assistantMessage.
Default HSN for jewellery can be "711319" when appropriate.
SKU can be a short suggested code based on product type (max 40 chars, letters/numbers/hyphens).`;
}

function ensureMin(text: string, min: number, fallback: string): string {
  const t = text.trim();
  if (t.length >= min) return t;
  if (!t) return fallback;
  return `${t} ${fallback}`.slice(0, Math.max(min, t.length + fallback.length));
}

function coerceAttributes(
  value: unknown,
): Record<string, string> | null | undefined {
  if (value == null) return value as null | undefined;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v == null) continue;
    out[k] = String(v);
  }
  return out;
}

function resolveCategoryId(
  obj: Record<string, unknown>,
  categories: CategoryOption[],
): string | null {
  const categoryIds = new Set(categories.map((c) => c.id));
  let categoryId =
    typeof obj.categoryId === "string" ? obj.categoryId.trim() : null;
  if (categoryId && categoryIds.has(categoryId)) return categoryId;

  const label = String(obj.categoryName || "").toLowerCase().trim();
  if (label) {
    const exact = categories.find((c) => c.name.toLowerCase() === label);
    if (exact) return exact.id;
    const fuzzy = categories.find(
      (c) =>
        c.name.toLowerCase().includes(label) ||
        label.includes(c.name.toLowerCase()) ||
        (c.slug && label.includes(c.slug.toLowerCase())),
    );
    if (fuzzy) return fuzzy.id;
  }

  const name = String(obj.name || "").toLowerCase();
  const byProductName = categories.find((c) => {
    const n = c.name.toLowerCase();
    return n.length >= 4 && name.includes(n.replace(/s$/, ""));
  });
  return byProductName?.id || null;
}

function parseDraft(
  raw: unknown,
  categories: CategoryOption[],
): { draft: AiProductDraft; assistantMessage: string } {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const assistantMessage =
    typeof obj.assistantMessage === "string" && obj.assistantMessage.trim()
      ? obj.assistantMessage.trim()
      : "I've prepared a draft from your photo. Please confirm category, price, and stock, then apply to the form.";

  const name =
    typeof obj.name === "string" && obj.name.trim().length >= 3
      ? obj.name.trim()
      : "Handcrafted Jewellery Piece";

  let sku =
    typeof obj.sku === "string" && obj.sku.trim().length >= 3
      ? obj.sku.trim().replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 50)
      : null;
  if (sku && sku.length < 3) sku = null;

  const draft = aiProductDraftSchema.parse({
    ...obj,
    name,
    categoryId: resolveCategoryId(obj, categories),
    brand:
      typeof obj.brand === "string" && obj.brand.trim().length >= 2
        ? obj.brand.trim()
        : "VIDYORA",
    shortDescription: ensureMin(
      String(obj.shortDescription || ""),
      20,
      "Elegant jewellery crafted for everyday and festive wear.",
    ).slice(0, 500),
    description: ensureMin(
      String(obj.description || ""),
      50,
      "This handcrafted piece features careful finishing and a timeless design suited to Indian occasions. Pair it with ethnic or contemporary outfits for a refined look.",
    ).slice(0, 5000),
    sku,
    attributes: coerceAttributes(obj.attributes),
    questions: Array.isArray(obj.questions) ? obj.questions : [],
  });

  return { draft, assistantMessage };
}

async function callOpenAI(params: {
  system: string;
  userText: string;
  image?: ImagePayload;
  history?: AiChatMessage[];
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!.trim();
  const base = (
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: params.system },
  ];

  for (const msg of params.history || []) {
    messages.push({ role: msg.role, content: msg.content });
  }

  if (params.image) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: params.userText },
        {
          type: "image_url",
          image_url: {
            url: `data:${params.image.mimeType};base64,${params.image.base64}`,
          },
        },
      ],
    });
  } else {
    messages.push({ role: "user", content: params.userText });
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("OpenAI error:", res.status, errText);
    throw new Error("AI provider request failed. Please try again.");
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return content;
}

function geminiTextModels(): string[] {
  const configured = process.env.GEMINI_MODEL?.trim();
  // Match ContentVerse fallback chain (models rotate as Google retires older ones)
  const chain = [
    configured,
    "gemini-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ].filter((m): m is string => Boolean(m));
  return [...new Set(chain)];
}

function normalizeGeminiHistory(
  history: AiChatMessage[] | undefined,
): Array<{ role: string; parts: Array<Record<string, unknown>> }> {
  const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> =
    [];

  for (const msg of history || []) {
    const role = msg.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts.push({ text: msg.content });
      continue;
    }
    contents.push({ role, parts: [{ text: msg.content }] });
  }

  // Gemini requires the first turn to be from the user.
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }

  return contents;
}

async function callGemini(params: {
  system: string;
  userText: string;
  image?: ImagePayload;
  history?: AiChatMessage[];
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const models = geminiTextModels();
  let lastError = "AI provider request failed. Please try again.";

  const contents = normalizeGeminiHistory(params.history);
  const userParts: Array<Record<string, unknown>> = [
    { text: params.userText },
  ];
  if (params.image) {
    // ContentVerse / Gemini REST: camelCase inlineData
    userParts.push({
      inlineData: {
        mimeType: params.image.mimeType,
        data: params.image.base64,
      },
    });
  }
  contents.push({ role: "user", parts: userParts });

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.system }] },
        contents,
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
        },
      }),
      cache: "no-store",
    });

    const errText = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("Gemini error:", model, res.status, errText.slice(0, 400));
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        if (parsed.error?.message) lastError = parsed.error.message;
      } catch {
        /* keep default */
      }
      if (res.status === 429) {
        lastError =
          "AI quota exceeded for now. Please try again in a few minutes.";
        continue;
      }
      if (res.status === 503) {
        lastError =
          "AI is busy right now. Retrying another model…";
        continue;
      }
      continue;
    }

    let data: {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    try {
      data = JSON.parse(errText) as typeof data;
    } catch {
      lastError = "Invalid Gemini response";
      continue;
    }

    const content = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim();
    if (content) return content;
  }

  throw new Error(lastError);
}

async function callModel(params: {
  system: string;
  userText: string;
  image?: ImagePayload;
  history?: AiChatMessage[];
}): Promise<string> {
  const provider = getProvider();
  if (provider === "openai") return callOpenAI(params);
  return callGemini(params);
}

export async function analyzeJewelleryProduct(params: {
  image: ImagePayload;
  categories: CategoryOption[];
}): Promise<{ draft: AiProductDraft; assistantMessage: string }> {
  const system = buildSystemPrompt(params.categories);
  const userText = `Analyze this jewellery product photo and create a complete listing draft JSON. Prefer matching the closest category from the list. Ask for selling price and stock if you cannot infer them.`;
  const text = await callModel({
    system,
    userText,
    image: params.image,
  });
  return parseDraft(extractJsonObject(text), params.categories);
}

export async function refineJewelleryProductDraft(params: {
  image?: ImagePayload;
  draft: AiProductDraft;
  categories: CategoryOption[];
  history: AiChatMessage[];
  userMessage: string;
}): Promise<{ draft: AiProductDraft; assistantMessage: string }> {
  const system = buildSystemPrompt(params.categories);
  const userText = `Current draft JSON:
${JSON.stringify(params.draft)}

Seller message:
${params.userMessage}

Update the draft JSON based on the seller's message. Keep unchanged fields unless the seller asked to change them. Reply with the full updated JSON including assistantMessage.`;

  const text = await callModel({
    system,
    userText,
    image: params.image,
    history: params.history,
  });
  return parseDraft(extractJsonObject(text), params.categories);
}

export function isAiConfigured(): boolean {
  try {
    getProvider();
    return true;
  } catch {
    return false;
  }
}

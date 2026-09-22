import {
  aiProductDraftSchema,
  type AiChatMessage,
  type AiProductDraft,
} from "@/lib/validations/ai-product-draft";
import type { ImagePayload } from "@/lib/ai/load-product-image";
import { suggestProductSize } from "@/lib/products/size-options";

type CategoryOption = { id: string; name: string; slug?: string };

function getProvider(): "openai" | "gemini" {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "openai" || forced === "gemini") return forced;
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (
    process.env.GEMINI_BLOG_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  )
    return "gemini";
  throw new Error(
    "AI is not configured. Set GEMINI_BLOG_API_KEY / GEMINI_API_KEY or OPENAI_API_KEY on the server.",
  );
}

/** Prefer ContentVerse create-blog key when present. */
function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_BLOG_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    ""
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
- CRITICAL: Choose the product TYPE category (Earrings, Necklaces, Finger Rings, Bangles, Pendants, Jhumkas, Chains, Bracelets, Anklets, Mangalsutra, Nose Pins, Jewellery Sets, Gold Coins, etc.).
- Do NOT pick metal/material categories like Gold, Diamond, Ruby, Emerald, or Gemstone just because the piece is gold/diamond — put that in attributes.metal / attributes.stone instead.
- Only use Gold / Diamond / Gemstone categories when the listing is clearly that collection (e.g. gold coin → Gold Coins).
Categories:
${categoryLines || "(none provided)"}

For jewellery attributes object, also try to fill when visible in the photo:
- metal: Default to "Stainless Steel" unless the piece is clearly another finish. Allowed: Gold Finish | Yellow Gold Finish | White Gold Finish | Rose Gold Finish | Silver Finish | Platinum Finish | Stainless Steel | Diamond Finish | Oxidised Finish | Other Finish
- karatage / purity: e.g. 22K, 18K
- quality: Default to "316L" when metal is Stainless Steel; otherwise e.g. 22K / 18K related notes if relevant
- colour / materialColour: Yellow | White | Rose
- weight / grossWeight: e.g. 4.25g
- size: Choose by jewellery type when not labeled on the photo:
  - Rings / Finger Rings → "Adjustable"
  - Bracelets / Bangles / Kadas / Anklets → "Free Size"
  - Earrings / Jhumkas / Studs / Hoops / Nose Pins → "One Size"
  - Necklaces / Chains / Pendants / Mangalsutra / Chokers → "18 inches" (or "16 inches" / "20 inches" if clearly that length)
  - Jewellery Sets → "Free Size"
  If a fixed size is clearly labeled (e.g. "Size 12", "2.6"), use that instead.
- stone, finish when obvious

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

/** Metal/material collection categories — avoid when a jewellery type is clear. */
const MATERIAL_CATEGORY_KEYS = new Set([
  "gold",
  "silver",
  "diamond",
  "emerald",
  "ruby",
  "gemstone",
  "platinum",
  "jewelry",
  "jewellery",
  "electronic",
  "accessories",
]);

const TYPE_KEYWORD_RULES: Array<{ keys: string[]; prefer: string[] }> = [
  { keys: ["jhumka", "jhumkas"], prefer: ["jhumkas"] },
  { keys: ["hoop"], prefer: ["hoops", "hoop earrings"] },
  { keys: ["stud"], prefer: ["studs", "stud earrings"] },
  { keys: ["drop earring", "drops"], prefer: ["drops", "drop earrings"] },
  { keys: ["earring", "earrings"], prefer: ["earrings"] },
  { keys: ["mangalsutra", "mangal sutra"], prefer: ["mangalsutra"] },
  { keys: ["necklace", "necklaces", "haar"], prefer: ["necklaces"] },
  { keys: ["pendant", "locket"], prefer: ["pendants"] },
  { keys: ["bangle", "bangles"], prefer: ["bangles"] },
  { keys: ["bracelet"], prefer: ["bracelets"] },
  { keys: ["chain", "chains"], prefer: ["chains"] },
  { keys: ["choker"], prefer: ["choker", "chokers"] },
  { keys: ["anklet", "payal", "pajeb"], prefer: ["anklets"] },
  { keys: ["nose pin", "nosepin", "nath", "nose ring"], prefer: ["nosepin", "nose pins"] },
  { keys: ["kada", "kadas"], prefer: ["kadas"] },
  { keys: ["finger ring", "rings", "ring"], prefer: ["rings", "finger rings"] },
  { keys: ["jewellery set", "jewelry set", "bridal set", "set"], prefer: ["sets", "jewellery sets"] },
  { keys: ["gold coin", "coin"], prefer: ["coins", "gold coins"] },
];

function isMaterialCategory(c: CategoryOption): boolean {
  const slug = (c.slug || "").toLowerCase().trim();
  const name = c.name.toLowerCase().trim();
  return MATERIAL_CATEGORY_KEYS.has(slug) || MATERIAL_CATEGORY_KEYS.has(name);
}

function findCategoryByPrefer(
  categories: CategoryOption[],
  prefer: string[],
): CategoryOption | null {
  for (const p of prefer) {
    const key = p.toLowerCase();
    const hit = categories.find((c) => {
      const slug = (c.slug || "").toLowerCase();
      const name = c.name.toLowerCase();
      return slug === key || name === key || name.includes(key) || slug.includes(key);
    });
    if (hit) return hit;
  }
  return null;
}

function findCategoryByTypeKeywords(
  text: string,
  categories: CategoryOption[],
): CategoryOption | null {
  const t = text.toLowerCase();
  for (const rule of TYPE_KEYWORD_RULES) {
    if (!rule.keys.some((k) => t.includes(k))) continue;
    const hit = findCategoryByPrefer(categories, rule.prefer);
    if (hit) return hit;
  }
  return null;
}

function resolveCategoryId(
  obj: Record<string, unknown>,
  categories: CategoryOption[],
): string | null {
  const categoryIds = new Set(categories.map((c) => c.id));
  const haystack = [
    obj.name,
    obj.categoryName,
    obj.shortDescription,
    obj.description,
  ]
    .map((v) => String(v || ""))
    .join(" ");

  const byType = findCategoryByTypeKeywords(haystack, categories);

  let categoryId =
    typeof obj.categoryId === "string" ? obj.categoryId.trim() : null;
  if (categoryId && categoryIds.has(categoryId)) {
    const chosen = categories.find((c) => c.id === categoryId)!;
    // AI often picks "Gold" because the metal is gold — prefer jewellery type.
    if (isMaterialCategory(chosen) && byType) return byType.id;
    return categoryId;
  }

  if (byType) return byType.id;

  const label = String(obj.categoryName || "").toLowerCase().trim();
  if (label && !MATERIAL_CATEGORY_KEYS.has(label)) {
    const exact = categories.find((c) => c.name.toLowerCase() === label);
    if (exact && !isMaterialCategory(exact)) return exact.id;
    const fuzzy = categories.find((c) => {
      if (isMaterialCategory(c)) return false;
      const name = c.name.toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return (
        name.includes(label) ||
        label.includes(name) ||
        (slug && (label.includes(slug) || slug.includes(label)))
      );
    });
    if (fuzzy) return fuzzy.id;
  }

  const name = String(obj.name || "").toLowerCase();
  const byProductName = categories.find((c) => {
    if (isMaterialCategory(c)) return false;
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

  const categoryId = resolveCategoryId(obj, categories);
  const categoryName =
    categories.find((c) => c.id === categoryId)?.name ||
    (typeof obj.categoryName === "string" ? obj.categoryName : null);

  const attributes = coerceAttributes(obj.attributes) || {};
  if (!attributes.size?.trim()) {
    const cat = categories.find((c) => c.id === categoryId);
    attributes.size = suggestProductSize({
      name,
      categoryName: categoryName || cat?.name,
      categorySlug: cat?.slug,
    });
  }
  // Catalog default — sellers can change in the guided Metal finish step.
  if (!attributes.metal?.trim()) {
    attributes.metal = "Stainless Steel";
  }
  if (
    !attributes.quality?.trim() &&
    /stainless\s*steel/i.test(attributes.metal)
  ) {
    attributes.quality = "316L";
  }

  const draft = aiProductDraftSchema.parse({
    ...obj,
    name,
    categoryId,
    categoryName,
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
    attributes,
    questions: Array.isArray(obj.questions) ? obj.questions : [],
  });

  return { draft, assistantMessage };
}

async function callOpenAI(params: {
  system: string;
  userText: string;
  images?: ImagePayload[];
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

  const images = params.images?.slice(0, 3) || [];
  if (images.length > 0) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: params.userText },
        ...images.map((image) => ({
          type: "image_url",
          image_url: {
            url: `data:${image.mimeType};base64,${image.base64}`,
          },
        })),
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
  images?: ImagePayload[];
  history?: AiChatMessage[];
}): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_BLOG_API_KEY / GEMINI_API_KEY is not configured");
  }
  const models = geminiTextModels();
  let lastError = "AI provider request failed. Please try again.";

  const contents = normalizeGeminiHistory(params.history);
  const userParts: Array<Record<string, unknown>> = [
    { text: params.userText },
  ];
  for (const image of (params.images || []).slice(0, 3)) {
    userParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
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
  images?: ImagePayload[];
  history?: AiChatMessage[];
}): Promise<string> {
  const provider = getProvider();
  if (provider === "openai") return callOpenAI(params);
  return callGemini(params);
}

export async function analyzeJewelleryProduct(params: {
  image?: ImagePayload;
  images?: ImagePayload[];
  categories: CategoryOption[];
}): Promise<{ draft: AiProductDraft; assistantMessage: string }> {
  const images = (params.images?.length ? params.images : params.image ? [params.image] : []).slice(
    0,
    3,
  );
  if (images.length === 0) {
    throw new Error("At least one product image is required");
  }
  const system = buildSystemPrompt(params.categories);
  const userText = `Analyze ${images.length > 1 ? `these ${images.length} jewellery product photos` : "this jewellery product photo"} and create a complete listing draft JSON. Prefer matching the closest category from the list. Ask for selling price and stock if you cannot infer them.`;
  const text = await callModel({
    system,
    userText,
    images,
  });
  return parseDraft(extractJsonObject(text), params.categories);
}

export async function refineJewelleryProductDraft(params: {
  image?: ImagePayload;
  images?: ImagePayload[];
  draft: AiProductDraft;
  categories: CategoryOption[];
  history: AiChatMessage[];
  userMessage: string;
}): Promise<{ draft: AiProductDraft; assistantMessage: string }> {
  const images = (params.images?.length ? params.images : params.image ? [params.image] : []).slice(
    0,
    3,
  );
  const system = buildSystemPrompt(params.categories);
  const userText = `Current draft JSON:
${JSON.stringify(params.draft)}

Seller message:
${params.userMessage}

Update the draft JSON based on the seller's message. Keep unchanged fields unless the seller asked to change them. Reply with the full updated JSON including assistantMessage.`;

  const text = await callModel({
    system,
    userText,
    images: images.length ? images : undefined,
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

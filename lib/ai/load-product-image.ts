import { readFile } from "fs/promises";
import path from "path";

export type ImagePayload = {
  mimeType: string;
  base64: string;
};

function mimeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

/**
 * Load a product image for vision models. Allows absolute http(s) URLs
 * or seller-owned /uploads/products/{sellerId}/... paths.
 */
export async function loadProductImageForAi(
  imageUrl: string,
  sellerUserId: string,
): Promise<ImagePayload> {
  const trimmed = imageUrl.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const allowedHosts = [
      process.env.STORAGE_PUBLIC_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.AUTH_URL,
      process.env.NEXTAUTH_URL,
    ]
      .filter(Boolean)
      .map((u) => {
        try {
          return new URL(u!).host;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    const host = new URL(trimmed).host;
    if (
      allowedHosts.length > 0 &&
      !allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))
    ) {
      // Still allow if path looks like our product uploads key on public CDN
      if (!trimmed.includes("/uploads/products/")) {
        throw new Error("Image URL is not allowed for AI analysis");
      }
    }

    const res = await fetch(trimmed, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Could not download the product image for AI analysis");
    }
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      throw new Error("URL is not an image");
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length > 6 * 1024 * 1024) {
      throw new Error("Image is too large for AI analysis");
    }
    return { mimeType: mimeType.split(";")[0], base64: buffer.toString("base64") };
  }

  if (!trimmed.startsWith("/uploads/products/")) {
    throw new Error("Only product upload images can be analyzed");
  }

  const expectedPrefix = `/uploads/products/${sellerUserId}/`;
  if (!trimmed.startsWith(expectedPrefix)) {
    throw new Error("Image does not belong to your seller account");
  }

  const relative = trimmed.replace(/^\/+/, "");
  const candidates = [
    path.join(process.cwd(), "public", ...relative.split("/")),
    // Standalone deploy sometimes keeps uploads one level up from app cwd
    path.join(process.cwd(), "..", "public", ...relative.split("/")),
  ];

  let buffer: Buffer | null = null;
  let usedPath = candidates[0];
  for (const abs of candidates) {
    try {
      buffer = await readFile(abs);
      usedPath = abs;
      break;
    } catch {
      /* try next */
    }
  }

  if (!buffer) {
    // Last resort: fetch through the app's own uploads route
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      process.env.AUTH_URL?.replace(/\/$/, "") ||
      process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
      "http://127.0.0.1:3002";
    try {
      const res = await fetch(`${base}${trimmed}`, { cache: "no-store" });
      if (res.ok) {
        buffer = Buffer.from(await res.arrayBuffer());
        usedPath = trimmed;
      }
    } catch {
      /* fall through */
    }
  }

  if (!buffer) {
    throw new Error("Could not read the uploaded product image for AI analysis");
  }
  if (buffer.length > 6 * 1024 * 1024) {
    throw new Error("Image is too large for AI analysis");
  }

  return {
    mimeType: mimeFromExt(usedPath),
    base64: buffer.toString("base64"),
  };
}

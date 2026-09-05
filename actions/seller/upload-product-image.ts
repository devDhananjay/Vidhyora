"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getActingSeller } from "@/lib/seller-context";
import type { ActionResult } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function uploadProductImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose an image" };
    }
    if (file.size > MAX_BYTES) {
      return { success: false, error: "Image must be 5 MB or smaller" };
    }
    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return { success: false, error: "Upload a JPG, PNG, or WEBP image" };
    }

    const dir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "products",
      acting.sellerUserId,
    );
    await mkdir(dir, { recursive: true });

    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeName || "image"}.${ext}`;
    await writeFile(
      path.join(dir, filename),
      Buffer.from(await file.arrayBuffer()),
    );

    return {
      success: true,
      data: {
        url: `/uploads/products/${acting.sellerUserId}/${filename}`,
      },
    };
  } catch (error) {
    console.error("Upload product image error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

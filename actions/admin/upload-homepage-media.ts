"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 40 * 1024 * 1024;

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

/**
 * Admin homepage media upload (image or video).
 * Stored under public/uploads/homepage — served via nginx /uploads/ and route fallback.
 */
export async function uploadHomepageMedia(
  formData: FormData,
): Promise<ActionResult<{ url: string; kind: "image" | "video" }>> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose an image or video" };
    }

    const imageExt = IMAGE_TYPES.get(file.type);
    const videoExt = VIDEO_TYPES.get(file.type);

    if (!imageExt && !videoExt) {
      return {
        success: false,
        error: "Upload JPG/PNG/WEBP image or MP4/WEBM video",
      };
    }

    const kind = imageExt ? ("image" as const) : ("video" as const);
    const ext = imageExt ?? videoExt!;
    const max = kind === "image" ? IMAGE_MAX : VIDEO_MAX;
    if (file.size > max) {
      return {
        success: false,
        error:
          kind === "image"
            ? "Image must be 5 MB or smaller"
            : "Video must be 40 MB or smaller",
      };
    }

    const dir = path.join(process.cwd(), "public", "uploads", "homepage");
    await mkdir(dir, { recursive: true });

    const safeBase = file.name
      .toLowerCase()
      .replace(/\.(jpe?g|png|webp|mp4|webm|mov|m4v)$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const filename = `${Date.now()}-${safeBase || kind}.${ext}`;
    await writeFile(
      path.join(dir, filename),
      Buffer.from(await file.arrayBuffer()),
    );

    return {
      success: true,
      data: { url: `/uploads/homepage/${filename}`, kind },
    };
  } catch (error) {
    console.error("Upload homepage media error:", error);
    return { success: false, error: "Failed to upload media" };
  }
}

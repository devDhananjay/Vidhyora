"use server";

import { mkdir, writeFile, unlink } from "fs/promises";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import { requireAdmin } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/utils";
import {
  HOMEPAGE_MEDIA_FITS,
  type HomepageMediaFit,
} from "@/lib/media/homepage-media-fit";

const IMAGE_MAX = 8 * 1024 * 1024;
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

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.slice(-500) || `ffmpeg exited ${code}`));
    });
  });
}

async function fitImage(
  input: Buffer,
  fit: HomepageMediaFit,
): Promise<{ buffer: Buffer; ext: string } | null> {
  try {
    // Dynamic import so a broken sharp install cannot crash the whole
    // admin homepage module graph (MediaUrlField → this action).
    const sharp = (await import("sharp")).default;
    const { width, height } = HOMEPAGE_MEDIA_FITS[fit];
    const buffer = await sharp(input)
      .rotate()
      .resize(width, height, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: false,
      })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    return { buffer, ext: "jpg" };
  } catch (error) {
    console.warn("Hero image fit skipped (sharp unavailable):", error);
    return null;
  }
}

async function fitVideo(
  input: Buffer,
  fit: HomepageMediaFit,
  sourceExt: string,
): Promise<{ buffer: Buffer; ext: string } | null> {
  const { width, height } = HOMEPAGE_MEDIA_FITS[fit];
  const tmpIn = path.join(
    os.tmpdir(),
    `vidyora-hero-in-${Date.now()}.${sourceExt}`,
  );
  const tmpOut = path.join(os.tmpdir(), `vidyora-hero-out-${Date.now()}.mp4`);

  try {
    await writeFile(tmpIn, input);
    // Cover-crop to exact homepage canvas, mute (hero autoplays muted)
    await runFfmpeg([
      "-y",
      "-i",
      tmpIn,
      "-vf",
      `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-an",
      "-movflags",
      "+faststart",
      "-pix_fmt",
      "yuv420p",
      tmpOut,
    ]);
    const buffer = await import("fs/promises").then((fs) =>
      fs.readFile(tmpOut),
    );
    return { buffer, ext: "mp4" };
  } catch (error) {
    console.warn("Hero video fit skipped (ffmpeg unavailable or failed):", error);
    return null;
  } finally {
    await unlink(tmpIn).catch(() => undefined);
    await unlink(tmpOut).catch(() => undefined);
  }
}

/**
 * Admin homepage media upload (image or video).
 * Optional `fit` crops/resizes to the homepage slot canvas.
 */
export async function uploadHomepageMedia(
  formData: FormData,
): Promise<
  ActionResult<{ url: string; kind: "image" | "video"; fitted: boolean }>
> {
  try {
    await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose an image or video" };
    }

    const fitRaw = String(formData.get("fit") || "").trim();
    const fit =
      fitRaw && fitRaw in HOMEPAGE_MEDIA_FITS
        ? (fitRaw as HomepageMediaFit)
        : null;

    const imageExt = IMAGE_TYPES.get(file.type);
    const videoExt = VIDEO_TYPES.get(file.type);

    if (!imageExt && !videoExt) {
      return {
        success: false,
        error: "Upload JPG/PNG/WEBP image or MP4/WEBM video",
      };
    }

    let kind = imageExt ? ("image" as const) : ("video" as const);
    let ext = imageExt ?? videoExt!;
    const max = kind === "image" ? IMAGE_MAX : VIDEO_MAX;
    if (file.size > max) {
      return {
        success: false,
        error:
          kind === "image"
            ? "Image must be 8 MB or smaller"
            : "Video must be 40 MB or smaller",
      };
    }

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());
    let fitted = false;

    if (fit && kind === "image") {
      const result = await fitImage(buffer, fit);
      if (result) {
        buffer = result.buffer;
        ext = result.ext;
        fitted = true;
      }
    } else if (fit && kind === "video") {
      const result = await fitVideo(buffer, fit, ext);
      if (result) {
        buffer = result.buffer;
        ext = result.ext;
        kind = "video";
        fitted = true;
      }
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
    const filename = `${Date.now()}-${safeBase || kind}${fitted ? `-${fit}` : ""}.${ext}`;
    await writeFile(path.join(dir, filename), buffer);

    return {
      success: true,
      data: { url: `/uploads/homepage/${filename}`, kind, fitted },
    };
  } catch (error) {
    console.error("Upload homepage media error:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (/ENOSPC|no space left/i.test(message)) {
      return {
        success: false,
        error:
          "Server disk is full — cannot save upload. Free space on the server and try again.",
      };
    }
    if (/EACCES|permission denied/i.test(message)) {
      return {
        success: false,
        error: "Server cannot write to uploads folder. Check folder permissions.",
      };
    }
    return { success: false, error: "Failed to upload media" };
  }
}

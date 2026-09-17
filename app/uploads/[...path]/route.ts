import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import type { NextRequest } from "next/server";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
};

/**
 * Serve runtime uploads for Next.js standalone.
 * Standalone does not reliably expose files written to public/ after boot.
 * Supports Range requests so Safari/Chrome can preview and seek videos.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  if (!parts?.length) {
    return new Response("Not found", { status: 404 });
  }

  // Prevent path traversal
  if (parts.some((part) => part === ".." || part.includes("\0"))) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...parts);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(uploadsRoot) + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const stat = statSync(resolved);
  const fileSize = stat.size;
  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const isVideo = contentType.startsWith("video/");

  const range = request.headers.get("range");
  if (range && isVideo) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match) {
      return new Response("Invalid Range", { status: 416 });
    }
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : fileSize - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }
    end = Math.min(end, fileSize - 1);
    // Cap chunk size for smoother scrubbing
    if (end - start + 1 > 2 * 1024 * 1024) {
      end = start + 2 * 1024 * 1024 - 1;
    }

    const stream = createReadStream(resolved, { start, end });
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = createReadStream(resolved);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

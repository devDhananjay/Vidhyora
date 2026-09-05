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
};

/**
 * Serve runtime uploads for Next.js standalone.
 * Standalone does not reliably expose files written to public/ after boot.
 */
export async function GET(
  _request: NextRequest,
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

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const stream = createReadStream(resolved);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

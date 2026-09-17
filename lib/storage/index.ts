/**
 * File uploads — local disk in development, S3/R2 when STORAGE_* is set.
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export type UploadOptions = {
  maxSize?: number;
  allowedTypes?: string[];
  folder?: string;
};

const DEFAULT_OPTIONS: UploadOptions = {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  folder: "uploads",
};

function storageConfigured() {
  return Boolean(
    process.env.STORAGE_BUCKET?.trim() &&
      process.env.STORAGE_ACCESS_KEY?.trim() &&
      process.env.STORAGE_SECRET_KEY?.trim(),
  );
}

function getS3Client() {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT || undefined,
    region: process.env.STORAGE_REGION || "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY!,
      secretAccessKey: process.env.STORAGE_SECRET_KEY!,
    },
    forcePathStyle: Boolean(process.env.STORAGE_ENDPOINT),
  });
}

export function validateFile(
  file: { size: number; type: string },
  options: UploadOptions = DEFAULT_OPTIONS,
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.maxSize && file.size > opts.maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${opts.maxSize / 1024 / 1024}MB`,
    };
  }

  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${opts.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

function sanitizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function extensionFor(file: File) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[file.type] || "bin";
}

export async function uploadFile(
  file: File,
  options: UploadOptions = DEFAULT_OPTIONS,
): Promise<UploadedFile> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const validation = validateFile(file, opts);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const folder = (opts.folder || "uploads").replace(/^\/+|\/+$/g, "");
  const ext = extensionFor(file);
  const base = sanitizeName(file.name) || "file";
  const key = `${folder}/${Date.now()}-${base}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (storageConfigured()) {
    const client = getS3Client();
    const bucket = process.env.STORAGE_BUCKET!;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const publicBase = (
      process.env.STORAGE_PUBLIC_URL ||
      process.env.STORAGE_ENDPOINT ||
      ""
    ).replace(/\/$/, "");
    const url = publicBase
      ? `${publicBase}/${key}`
      : `https://${bucket}.s3.amazonaws.com/${key}`;

    return {
      url,
      key,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  const absDir = path.join(process.cwd(), "public", ...folder.split("/"));
  await mkdir(absDir, { recursive: true });
  const filename = path.basename(key);
  await writeFile(path.join(absDir, filename), buffer);

  return {
    url: `/${folder}/${filename}`.replace(/\/+/g, "/"),
    key,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export async function uploadFiles(
  files: File[],
  options: UploadOptions = DEFAULT_OPTIONS,
): Promise<UploadedFile[]> {
  return Promise.all(files.map((file) => uploadFile(file, options)));
}

export function getPublicUrl(key: string): string {
  if (storageConfigured() && process.env.STORAGE_PUBLIC_URL) {
    return `${process.env.STORAGE_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  return `/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (!storageConfigured()) return;
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.STORAGE_BUCKET!,
      Key: key,
    }),
  );
}

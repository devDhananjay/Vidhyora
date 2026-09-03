/**
 * Image Upload and Storage Service
 * Supports both local storage (dev) and cloud storage (production)
 */

export type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
};

export type UploadOptions = {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  folder?: string;
};

const DEFAULT_OPTIONS: UploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  folder: "uploads",
};

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: UploadOptions = DEFAULT_OPTIONS,
): { valid: boolean; error?: string } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (opts.maxSize && file.size > opts.maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${opts.maxSize / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${opts.allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to storage
 * For production: Swap this implementation with S3/Cloudflare R2
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = DEFAULT_OPTIONS,
): Promise<UploadedFile> {
  // Validate file
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // For development: Convert to base64 data URL
  // For production: Replace with actual S3/Cloudflare R2 upload
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const key = `${options.folder}/${Date.now()}-${file.name}`;
      
      resolve({
        url: dataUrl, // In production, this would be the S3/CDN URL
        key,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = DEFAULT_OPTIONS,
): Promise<UploadedFile[]> {
  const uploads = files.map((file) => uploadFile(file, options));
  return Promise.all(uploads);
}

/**
 * Delete file from storage
 * For production: Implement actual S3 deletion
 */
export async function deleteFile(key: string): Promise<void> {
  // For production: Implement S3/Cloudflare R2 deletion
  console.log(`File deleted: ${key}`);
}

/**
 * Get public URL for a file
 * For production: Return CDN URL
 */
export function getFileUrl(key: string): string {
  // For production: Return proper CDN URL
  // For now, return the key as-is (assuming it's a data URL or relative path)
  return key;
}

/**
 * Compress image before upload
 * Basic implementation - for production consider using sharp or similar
 */
export async function compressImage(file: File, maxWidth = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          file.type,
          0.85, // Quality
        );
      };
      
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// PRODUCTION IMPLEMENTATION GUIDE
// =============================================================================
/**
 * To use with S3/Cloudflare R2 in production:
 * 
 * 1. Install dependencies:
 *    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 
 * 2. Add environment variables:
 *    STORAGE_ENDPOINT=https://s3.amazonaws.com (or Cloudflare R2 endpoint)
 *    STORAGE_ACCESS_KEY=your_access_key
 *    STORAGE_SECRET_KEY=your_secret_key
 *    STORAGE_BUCKET=your_bucket_name
 *    STORAGE_REGION=us-east-1
 *    STORAGE_PUBLIC_URL=https://cdn.yourdomain.com
 * 
 * 3. Replace uploadFile function with:
 * 
 *    import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
 *    import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
 * 
 *    const s3Client = new S3Client({
 *      endpoint: process.env.STORAGE_ENDPOINT,
 *      region: process.env.STORAGE_REGION || "auto",
 *      credentials: {
 *        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
 *        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
 *      },
 *    });
 * 
 *    export async function uploadFile(file: File, options: UploadOptions = DEFAULT_OPTIONS) {
 *      const validation = validateFile(file, options);
 *      if (!validation.valid) throw new Error(validation.error);
 * 
 *      const key = `${options.folder}/${Date.now()}-${file.name}`;
 *      const buffer = Buffer.from(await file.arrayBuffer());
 * 
 *      await s3Client.send(new PutObjectCommand({
 *        Bucket: process.env.STORAGE_BUCKET!,
 *        Key: key,
 *        Body: buffer,
 *        ContentType: file.type,
 *      }));
 * 
 *      return {
 *        url: `${process.env.STORAGE_PUBLIC_URL}/${key}`,
 *        key,
 *        name: file.name,
 *        size: file.size,
 *        type: file.type,
 *      };
 *    }
 */

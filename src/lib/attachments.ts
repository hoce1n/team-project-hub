import path from "node:path";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "text/csv": ".csv",
  "application/json": ".json",
};

export function extensionFor(filename: string, mimeType: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (/^\.[a-z0-9]{1,10}$/.test(ext)) {
    return ext;
  }
  return ALLOWED_TYPES[mimeType] ?? ".bin";
}

export function attachmentDiskPath(taskId: string, storedName: string): string {
  return path.join(UPLOAD_ROOT, taskId, storedName);
}

export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/["\r\n]/g, "");
}

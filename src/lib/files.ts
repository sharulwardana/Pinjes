/** URL for a stored upload path (served by /api/files with authorization). */
export function fileUrl(path: string | null | undefined): string | null {
  return path ? `/api/files/${path}` : null;
}

export const ACCEPT_IMAGES = "image/jpeg,image/png,image/webp";
export const ACCEPT_PROOF = "image/jpeg,image/png,image/webp,application/pdf";
export const MAX_UPLOAD_MB = 5;

/**
 * Farm photo upload rules, shared by every upload path. Mirrored by IMAGE_ACCEPT /
 * MAX_UPLOAD_BYTES in frontend/src/lib/fileDrop.ts; keep the two in sync.
 */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MAX_UPLOAD_LABEL = '10MB';

export const UNSUPPORTED_IMAGE_TYPE_MESSAGE =
  'Only JPG or PNG photos can be uploaded. Convert HEIC or other formats to JPG first.';

export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function oversizedImageMessage(bytes: number): string {
  return `Photos must be ${MAX_UPLOAD_LABEL} or smaller — this one is ${formatMegabytes(bytes)}.`;
}

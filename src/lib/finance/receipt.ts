/** The largest receipt image we accept, in bytes. */
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** The largest receipt image we accept, in megabytes (for user-facing copy). */
export const MAX_RECEIPT_MB = MAX_RECEIPT_BYTES / (1024 * 1024);

/** Image formats a receipt may be uploaded as. */
export const ACCEPTED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/** The `accept` attribute for a receipt file input. */
export const RECEIPT_ACCEPT = ACCEPTED_RECEIPT_TYPES.join(",");

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** The bits of a selected file the receipt rules care about. */
export interface ReceiptFileInfo {
  name: string;
  type: string;
  size: number;
}

export interface ReceiptValidation {
  valid: boolean;
  errors: string[];
}

/** True when `type` is one of the image formats receipts may use. */
export function isAcceptedReceiptType(type: string): boolean {
  return (ACCEPTED_RECEIPT_TYPES as readonly string[]).includes(
    type.trim().toLowerCase(),
  );
}

/** The file extension for a receipt MIME type, when we know one. */
export function receiptExtensionForType(type: string): string | null {
  return EXTENSION_BY_TYPE[type.trim().toLowerCase()] ?? null;
}

/**
 * Reduce a selected file name to something safe to put in a storage path:
 * the last path segment, lowercase, with unsafe characters folded to dashes.
 */
export function sanitizeReceiptFileName(name: string): string {
  const base = (name ?? "").split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-+\./g, ".")
    .replace(/^[-.]+|[-.]+$/g, "");

  return cleaned.length > 0 ? cleaned.slice(0, 100) : "receipt";
}

/** A safe storage file name, keeping the original extension (or adding one). */
export function receiptFileName(file: ReceiptFileInfo): string {
  const safe = sanitizeReceiptFileName(file.name);
  if (/\.[a-z0-9]{2,5}$/.test(safe)) return safe;

  const extension = receiptExtensionForType(file.type);
  return extension ? `${safe}.${extension}` : safe;
}

/** Check a selected file before uploading it as a receipt. */
export function validateReceiptFile(file: ReceiptFileInfo): ReceiptValidation {
  const errors: string[] = [];

  if (!file.name?.trim()) {
    errors.push("Choose a receipt image.");
  }
  if (!isAcceptedReceiptType(file.type)) {
    errors.push("Receipts must be a JPG, PNG, WebP, HEIC or HEIF image.");
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    errors.push("That file looks empty.");
  } else if (file.size > MAX_RECEIPT_BYTES) {
    errors.push(`Receipts must be ${MAX_RECEIPT_MB} MB or smaller.`);
  }

  return { valid: errors.length === 0, errors };
}

function sanitizePathSegment(value: string): string {
  const cleaned = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return cleaned.length > 0 ? cleaned : "unknown";
}

/** The storage folder holding one transaction's receipts. */
export function receiptFolder(userId: string, transactionId: string): string {
  return `${sanitizePathSegment(userId)}/${sanitizePathSegment(transactionId)}`;
}

/**
 * The storage path for a receipt. The timestamp is passed in so this stays
 * pure and the same input always produces the same path.
 */
export function buildReceiptPath(
  userId: string,
  transactionId: string,
  fileName: string,
  timestamp: number,
): string {
  const stamp = Number.isFinite(timestamp) && timestamp > 0 ? Math.floor(timestamp) : 0;
  return `${receiptFolder(userId, transactionId)}/${stamp}-${sanitizeReceiptFileName(fileName)}`;
}

/** Show the original file name for a stored receipt (drops our timestamp). */
export function displayReceiptName(objectName: string): string {
  const withoutStamp = (objectName ?? "").replace(/^\d+-/, "");
  return withoutStamp.length > 0 ? withoutStamp : "receipt";
}

/** A compact, human-readable file size such as `84 KB` or `1.4 MB`. */
export function formatReceiptSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${Math.round(bytes)} B`;

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }

  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

import {
  buildReceiptPath,
  displayReceiptName,
  receiptFileName,
  receiptFolder,
} from "@/lib/finance/receipt";
import type { Receipt } from "@/types/receipt";
import { getSupabaseClient } from "./client";

/** The Supabase Storage bucket that holds receipt images. */
export const RECEIPT_BUCKET = "receipts";

/** How long a signed receipt URL stays valid, in seconds. */
export const RECEIPT_URL_TTL_SECONDS = 60 * 60;

/** A minimal shape for the errors Supabase Storage returns. */
export interface ReceiptStorageError {
  message: string;
}

/** A storage object as returned by `list`, narrowed to the fields we use. */
interface ReceiptObjectRow {
  name: string;
  created_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
}

export interface UploadReceiptInput {
  userId: string;
  transactionId: string;
  file: File;
  /** Passed in so the write is predictable and testable. */
  timestamp: number;
}

export interface ReceiptsResult {
  data: Receipt[] | null;
  error: ReceiptStorageError | null;
}

export interface UploadReceiptResult {
  data: Receipt | null;
  error: ReceiptStorageError | null;
}

export interface ReceiptUrlsResult {
  data: Record<string, string> | null;
  error: ReceiptStorageError | null;
}

export interface DeleteReceiptResult {
  error: ReceiptStorageError | null;
}

function contentTypeFor(file: File): string {
  return file.type.trim() || "application/octet-stream";
}

function rowToReceipt(folder: string, row: ReceiptObjectRow): Receipt {
  const receipt: Receipt = {
    path: `${folder}/${row.name}`,
    fileName: displayReceiptName(row.name),
    size: row.metadata?.size ?? 0,
  };
  if (row.metadata?.mimetype) {
    receipt.contentType = row.metadata.mimetype;
  }
  if (row.created_at) {
    receipt.createdAt = row.created_at;
  }
  return receipt;
}

/**
 * Upload an image receipt for one transaction. The object is stored under
 * `<user>/<transaction>/<timestamp>-<file>`, so it is attached to that
 * transaction simply by living in its folder.
 */
export async function uploadReceipt(
  input: UploadReceiptInput,
): Promise<UploadReceiptResult> {
  const path = buildReceiptPath(
    input.userId,
    input.transactionId,
    receiptFileName({
      name: input.file.name,
      type: input.file.type,
      size: input.file.size,
    }),
    input.timestamp,
  );

  const { error } = await getSupabaseClient()
    .storage.from(RECEIPT_BUCKET)
    .upload(path, input.file, {
      contentType: contentTypeFor(input.file),
      upsert: false,
    });

  if (error) {
    return { data: null, error };
  }

  const receipt: Receipt = {
    path,
    fileName: displayReceiptName(path.split("/").pop() ?? ""),
    size: input.file.size,
    contentType: contentTypeFor(input.file),
  };
  if (input.timestamp > 0) {
    receipt.createdAt = new Date(input.timestamp).toISOString();
  }

  return { data: receipt, error: null };
}

/** List every receipt attached to one of the user's transactions, newest first. */
export async function listReceipts(
  userId: string,
  transactionId: string,
): Promise<ReceiptsResult> {
  const folder = receiptFolder(userId, transactionId);
  const { data, error } = await getSupabaseClient()
    .storage.from(RECEIPT_BUCKET)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } });

  return {
    data: data
      ? (data as ReceiptObjectRow[])
          .filter((row) => row.name && !row.name.endsWith("/"))
          .map((row) => rowToReceipt(folder, row))
      : null,
    error,
  };
}

/** Turn storage paths into short-lived preview URLs. */
export async function getReceiptUrls(
  paths: readonly string[],
): Promise<ReceiptUrlsResult> {
  if (paths.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await getSupabaseClient()
    .storage.from(RECEIPT_BUCKET)
    .createSignedUrls([...paths], RECEIPT_URL_TTL_SECONDS);

  if (error) {
    return { data: null, error };
  }

  const urls: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) {
      urls[entry.path] = entry.signedUrl;
    }
  }

  return { data: urls, error: null };
}

/** Delete one stored receipt by its path. */
export async function deleteReceipt(
  path: string,
): Promise<DeleteReceiptResult> {
  const { error } = await getSupabaseClient()
    .storage.from(RECEIPT_BUCKET)
    .remove([path]);

  return { error };
}

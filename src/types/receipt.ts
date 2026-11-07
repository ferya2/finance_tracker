/** An image receipt stored in the `receipts` bucket and attached to a transaction. */
export interface Receipt {
  /** Full path inside the storage bucket. */
  path: string;
  /** The original file name (without our timestamp prefix). */
  fileName: string;
  /** File size in bytes. */
  size: number;
  /** MIME type reported by Storage, when available. */
  contentType?: string;
  /** When the receipt was uploaded, as an ISO timestamp. */
  createdAt?: string;
}

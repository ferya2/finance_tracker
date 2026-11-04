import { sanitizeTransfers } from "@/lib/finance/transfer-form";
import type { Transfer } from "@/types/transfer";

export const TRANSFERS_STORAGE_PREFIX = "finance-tracker:transfers";

export const TRANSFERS_CHANGE_EVENT = "finance-tracker:transfers-change";

export interface TransferStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): TransferStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function transferStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${TRANSFERS_STORAGE_PREFIX}:${id.length > 0 ? id : "anonymous"}`;
}

export function parseTransfers(
  raw: string | null | undefined,
): Transfer[] {
  if (!raw) return [];

  try {
    return sanitizeTransfers(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function loadTransfers(
  userId?: string | null,
  storage: TransferStorage | null = browserStorage(),
): Transfer[] {
  if (!storage) return [];

  try {
    return parseTransfers(storage.getItem(transferStorageKey(userId)));
  } catch {
    return [];
  }
}

export function saveTransfers(
  userId: string | null | undefined,
  transfers: readonly Transfer[],
  storage: TransferStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(transferStorageKey(userId), JSON.stringify(transfers));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(TRANSFERS_CHANGE_EVENT));
    }
  } catch {
    return;
  }
}

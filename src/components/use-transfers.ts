"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseTransfers,
  TRANSFERS_CHANGE_EVENT,
  transferStorageKey,
} from "@/lib/storage/transfers";
import type { Transfer } from "@/types/transfer";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TRANSFERS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TRANSFERS_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): string {
  return "";
}

function readSnapshot(userId: string | null): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(transferStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function useTransfers(
  userId: string | null | undefined,
): Transfer[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(userId ?? null),
    getServerSnapshot,
  );

  return useMemo(() => parseTransfers(raw), [raw]);
}

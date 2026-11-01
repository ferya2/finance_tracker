"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseRecurringEntries,
  RECURRING_CHANGE_EVENT,
  recurringStorageKey,
} from "@/lib/storage/recurring";
import type { RecurringTransaction } from "@/types/recurring";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RECURRING_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RECURRING_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): string {
  return "";
}

function readSnapshot(userId: string | null): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(recurringStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

/** Read this user's locally stored recurring plans and react to changes. */
export function useRecurringEntries(
  userId: string | null | undefined,
): RecurringTransaction[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(userId ?? null),
    getServerSnapshot,
  );

  return useMemo(() => parseRecurringEntries(raw), [raw]);
}

/** True only after hydration, so storage-backed UI can wait for the client. */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

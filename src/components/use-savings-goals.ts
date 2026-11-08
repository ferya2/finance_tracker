"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  parseSavingsGoals,
  SAVINGS_GOALS_CHANGE_EVENT,
  savingsGoalsStorageKey,
} from "@/lib/storage/goals";
import type { SavingsGoal } from "@/types/goal";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SAVINGS_GOALS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SAVINGS_GOALS_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): string {
  return "";
}

function readSnapshot(userId: string | null): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(savingsGoalsStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function useSavingsGoals(
  userId: string | null | undefined,
): SavingsGoal[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(userId ?? null),
    getServerSnapshot,
  );

  return useMemo(() => parseSavingsGoals(raw), [raw]);
}

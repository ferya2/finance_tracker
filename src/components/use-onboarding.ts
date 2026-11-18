"use client";

import { useSyncExternalStore } from "react";
import {
  ONBOARDING_CHANGE_EVENT,
  ONBOARDING_COMPLETED_VALUE,
  onboardingStorageKey,
} from "@/lib/storage/onboarding";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ONBOARDING_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ONBOARDING_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): string {
  return "";
}

function readSnapshot(userId: string | null): string {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(onboardingStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function useOnboardingCompleted(
  userId: string | null | undefined,
): boolean {
  const raw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(userId ?? null),
    getServerSnapshot,
  );

  return raw === ONBOARDING_COMPLETED_VALUE;
}

"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { TagAssignment } from "@/lib/finance/tags";
import {
  parseTagAssignments,
  TAG_ASSIGNMENTS_CHANGE_EVENT,
  tagAssignmentStorageKey,
} from "@/lib/storage/tags";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TAG_ASSIGNMENTS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TAG_ASSIGNMENTS_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): string {
  return "";
}

function readSnapshot(userId: string | null): string {
  if (typeof window === "undefined") return "";

  try {
    return (
      window.localStorage.getItem(tagAssignmentStorageKey(userId)) ?? ""
    );
  } catch {
    return "";
  }
}

export function useTagAssignments(
  userId: string | null | undefined,
): TagAssignment[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readSnapshot(userId ?? null),
    getServerSnapshot,
  );

  return useMemo(() => parseTagAssignments(raw), [raw]);
}

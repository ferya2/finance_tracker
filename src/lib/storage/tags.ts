import {
  sanitizeTagAssignments,
  type TagAssignment,
} from "@/lib/finance/tags";

export const TAG_ASSIGNMENTS_STORAGE_PREFIX =
  "finance-tracker:transaction-tags";

export const TAG_ASSIGNMENTS_CHANGE_EVENT =
  "finance-tracker:transaction-tags-change";

export interface TagAssignmentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): TagAssignmentStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function tagAssignmentStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${TAG_ASSIGNMENTS_STORAGE_PREFIX}:${id.length > 0 ? id : "anonymous"}`;
}

export function parseTagAssignments(
  raw: string | null | undefined,
): TagAssignment[] {
  if (!raw) return [];

  try {
    return sanitizeTagAssignments(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function loadTagAssignments(
  userId?: string | null,
  storage: TagAssignmentStorage | null = browserStorage(),
): TagAssignment[] {
  if (!storage) return [];

  try {
    return parseTagAssignments(storage.getItem(tagAssignmentStorageKey(userId)));
  } catch {
    return [];
  }
}

export function saveTagAssignments(
  userId: string | null | undefined,
  assignments: readonly TagAssignment[],
  storage: TagAssignmentStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(
      tagAssignmentStorageKey(userId),
      JSON.stringify(sanitizeTagAssignments(assignments)),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(TAG_ASSIGNMENTS_CHANGE_EVENT));
    }
  } catch {
    return;
  }
}

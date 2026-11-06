/** How several selected tags combine when filtering. */
export type TagMatchMode = "any" | "all";

/**
 * What a transaction list is being filtered by. An empty selection keeps every
 * row, so the filter never hides anything until a tag is chosen.
 */
export interface TagFilter {
  /** The selected tag ids, in the order they were chosen. */
  tagIds: readonly string[];
  /** `"any"` keeps rows with at least one tag; `"all"` requires every one. */
  mode: TagMatchMode;
}

/** The fields a row needs to be filtered by tag. */
export interface TaggedRow {
  /** The tag ids attached to the row; missing means no tags. */
  tagIds?: readonly string[];
}

/** No tag selection — every transaction stays visible. */
export const EMPTY_TAG_FILTER: TagFilter = { tagIds: [], mode: "any" };

/** Longest tag name allowed, in characters. */
export const MAX_TAG_NAME_LENGTH = 32;

/** The tag ids attached to one transaction, keyed by its id. */
export interface TagAssignment {
  transactionId: string;
  tagIds: string[];
}

/**
 * The name as it is stored and compared: surrounding whitespace trimmed and
 * runs of inner whitespace collapsed to a single space.
 */
export function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** True when the name is non-empty after normalization and within the limit. */
export function isValidTagName(name: string): boolean {
  const normalized = normalizeTagName(name);
  return normalized.length > 0 && normalized.length <= MAX_TAG_NAME_LENGTH;
}

/** Case-insensitive key used to de-duplicate tag names. */
export function tagNameKey(name: string): string {
  return normalizeTagName(name).toLowerCase();
}

/** Drop blank ids and duplicates, keeping the first occurrence's order. */
export function uniqueTagIds(tagIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tagIds) {
    const id = raw.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

/**
 * True when nothing is selected. There is nothing to clear, and every row is
 * visible, so the filter can be treated as the default state.
 */
export function isDefaultTagFilter(filter: TagFilter): boolean {
  return uniqueTagIds(filter.tagIds).length === 0;
}

/**
 * True when a row's tags satisfy the filter. With no selected tags every row
 * matches. `"all"` requires every selected id to be present, `"any"` requires
 * at least one. Duplicate selections are ignored so a stale pick cannot make
 * `"all"` impossible to satisfy.
 */
export function matchesTagFilter(
  rowTagIds: readonly string[] | undefined,
  filter: TagFilter,
): boolean {
  const selected = uniqueTagIds(filter.tagIds);
  if (selected.length === 0) return true;

  const present = new Set(rowTagIds ?? []);
  return filter.mode === "all"
    ? selected.every((id) => present.has(id))
    : selected.some((id) => present.has(id));
}

/**
 * Keep only the rows whose tags satisfy the filter, in the order they were
 * given. The input is never mutated and no external state is read.
 */
export function filterByTags<T extends TaggedRow>(
  rows: readonly T[],
  filter: TagFilter,
): T[] {
  return rows.filter((row) => matchesTagFilter(row.tagIds, filter));
}

/**
 * Toggle one tag in the filter: add it when missing, remove it when present.
 * The match mode and the order of the other ids stay untouched. A blank id is
 * ignored and returns the filter unchanged.
 */
export function toggleTagFilter(filter: TagFilter, tagId: string): TagFilter {
  const id = tagId.trim();
  if (!id) return filter;

  const tagIds = filter.tagIds.includes(id)
    ? filter.tagIds.filter((existing) => existing !== id)
    : [...filter.tagIds, id];

  return { ...filter, tagIds };
}

/**
 * Toggle one tag in a transaction's assignment: add it when missing, remove it
 * when present. The result is normalized and never shares the input array.
 */
export function toggleTagId(
  tagIds: readonly string[],
  tagId: string,
): string[] {
  const id = tagId.trim();
  const current = uniqueTagIds(tagIds);
  if (!id) return current;

  return current.includes(id)
    ? current.filter((existing) => existing !== id)
    : [...current, id];
}

/** The tag ids assigned to one transaction, in their stored order. */
export function tagsForTransaction(
  assignments: readonly TagAssignment[],
  transactionId: string,
): string[] {
  const id = transactionId.trim();
  if (!id) return [];

  const match = assignments.find(
    (assignment) => assignment.transactionId === id,
  );
  return match ? [...match.tagIds] : [];
}

/**
 * Replace one transaction's tag ids. An empty selection removes its assignment
 * entirely. Other assignments keep their order, and the input is not mutated.
 */
export function withTransactionTags(
  assignments: readonly TagAssignment[],
  transactionId: string,
  tagIds: readonly string[],
): TagAssignment[] {
  const id = transactionId.trim();
  if (!id) {
    return assignments.map((assignment) => ({
      transactionId: assignment.transactionId,
      tagIds: [...assignment.tagIds],
    }));
  }

  const nextTagIds = uniqueTagIds(tagIds);
  const next: TagAssignment[] = [];
  let replaced = false;

  for (const assignment of assignments) {
    if (assignment.transactionId === id) {
      replaced = true;
      if (nextTagIds.length > 0) {
        next.push({ transactionId: id, tagIds: nextTagIds });
      }
    } else {
      next.push({
        transactionId: assignment.transactionId,
        tagIds: [...assignment.tagIds],
      });
    }
  }

  if (!replaced && nextTagIds.length > 0) {
    next.push({ transactionId: id, tagIds: nextTagIds });
  }

  return next;
}

/** How many transactions currently carry one tag. */
export function countAssignedTransactions(
  assignments: readonly TagAssignment[],
  tagId: string,
): number {
  const id = tagId.trim();
  if (!id) return 0;

  return assignments.filter((assignment) => assignment.tagIds.includes(id))
    .length;
}

/**
 * Turn untrusted stored data into clean assignments: drop blank transaction ids
 * and tag ids, de-duplicate both, merge repeated transaction entries and drop
 * rows left with no tags. Anything that is not an array becomes no assignments.
 */
export function sanitizeTagAssignments(value: unknown): TagAssignment[] {
  if (!Array.isArray(value)) return [];

  const merged = new Map<string, string[]>();

  for (const entry of value) {
    if (entry === null || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const transactionId =
      typeof record.transactionId === "string"
        ? record.transactionId.trim()
        : "";
    if (!transactionId) continue;

    const rawTagIds = Array.isArray(record.tagIds)
      ? record.tagIds.filter((id): id is string => typeof id === "string")
      : [];
    const tagIds = uniqueTagIds(rawTagIds);
    if (tagIds.length === 0) continue;

    const existing = merged.get(transactionId) ?? [];
    merged.set(transactionId, uniqueTagIds([...existing, ...tagIds]));
  }

  return Array.from(merged, ([transactionId, tagIds]) => ({
    transactionId,
    tagIds,
  }));
}

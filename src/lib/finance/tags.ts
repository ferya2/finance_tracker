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

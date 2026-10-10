/** The smallest page size worth slicing with, guarding against bad input. */
const MIN_PAGE_SIZE = 1;

/**
 * How many 1-based pages hold `total` items at `pageSize` each. An empty list
 * still counts as one page, so callers can render the "Page 1" state safely.
 */
export function countPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(MIN_PAGE_SIZE, pageSize)));
}

/**
 * Clamp a 1-based page into the valid range for `total` items at `pageSize`.
 * Out-of-range, negative and non-numeric pages all settle on the nearest valid
 * page, so a shrinking list can never leave the selector showing a dead page.
 */
export function clampPage(page: number, total: number, pageSize: number): number {
  if (Number.isNaN(page)) return 1;
  const last = countPages(total, pageSize);
  return Math.min(Math.max(1, Math.floor(page)), last);
}

/**
 * The slice of rows for one 1-based page, at `pageSize` per page. The page is
 * clamped first, so page 0, an over-large page, or a page on a list that has
 * just shrunk all fall back to the nearest valid page. Never mutates its input.
 */
export function paginate<T>(
  rows: readonly T[],
  page: number,
  pageSize: number,
): T[] {
  const start = (clampPage(page, rows.length, pageSize) - 1) * pageSize;
  return rows.slice(start, start + Math.max(MIN_PAGE_SIZE, pageSize));
}
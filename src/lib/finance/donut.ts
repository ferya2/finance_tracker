/** The fields a category breakdown row needs to become a donut slice. */
export interface DonutSourceRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Total spent in the category, in integer cents. */
  amount: number;
}

/** How many slices a donut shows before the tail is merged into one. */
export const MAX_DONUT_SLICES = 5;

/** The key and label used for the merged tail slice. */
export const OTHER_SLICE_KEY = "other";
const OTHER_SLICE_LABEL = "Other";
const OTHER_SLICE_COLOR = "#94a3b8";

/** One slice of the donut, ready to render. */
export interface DonutSlice {
  /** Stable identity: the category id, or {@link OTHER_SLICE_KEY} when merged. */
  key: string;
  label: string;
  color: string;
  /** What the slice covers, in integer cents. */
  amount: number;
  /**
   * Share of the total as a rounded 0-100 percent, for labels and legends.
   * The ring itself is drawn from `amount` so the arcs always add up to a full
   * circle — rounded percents can sum to 99 or 101.
   */
  percent: number;
}

/** A month's spending, shaped for a donut chart. */
export interface DonutBreakdown {
  /** Everything the slices cover, in integer cents. */
  total: number;
  /** Biggest first, with the tail merged into a single "Other" slice. */
  slices: DonutSlice[];
}

/** A slice's rounded share of the total; 0 when nothing is being covered. */
function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Shape a month's category breakdown into donut slices.
 *
 * Rows are sorted by amount, biggest first, keeping the incoming order for ties
 * so a stable breakdown stays stable on screen. Categories with no spending (or
 * a negative total from refunds) are dropped: a donut cannot show them, and they
 * must not inflate the total. At most `maxSlices` slices are returned — when
 * there are more, the smallest ones are merged into a single "Other" slice so
 * long tails do not turn into unreadable hairlines.
 *
 * Pure: the same rows always produce the same breakdown, and nothing is read
 * from a clock.
 */
export function buildDonutBreakdown(
  rows: readonly DonutSourceRow[],
  maxSlices: number = MAX_DONUT_SLICES,
): DonutBreakdown {
  const positive = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.amount > 0)
    .sort((a, b) => b.row.amount - a.row.amount || a.index - b.index);

  const total = positive.reduce((sum, { row }) => sum + row.amount, 0);
  const limit = Math.max(Math.trunc(maxSlices), 1);

  const slices: DonutSlice[] = positive.slice(0, limit).map(({ row }) => ({
    key: row.categoryId,
    label: row.categoryName,
    color: row.categoryColor,
    amount: row.amount,
    percent: sharePercent(row.amount, total),
  }));

  const tail = positive.slice(limit);
  if (tail.length > 0) {
    const amount = tail.reduce((sum, { row }) => sum + row.amount, 0);
    slices.push({
      key: OTHER_SLICE_KEY,
      label: OTHER_SLICE_LABEL,
      color: OTHER_SLICE_COLOR,
      amount,
      percent: sharePercent(amount, total),
    });
  }

  return { total, slices };
}

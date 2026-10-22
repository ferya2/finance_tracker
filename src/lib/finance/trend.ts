import type { Transaction } from "@/types/transaction";

/** How finely a trend line is broken down. */
export type TrendGranularity = "day" | "week" | "month";

/** One bucket on the trend line. */
export interface TrendPoint {
  /** Stable bucket key: `2026-09-14` for a day or a week, `2026-09` for a month. */
  key: string;
  /** Short axis label, e.g. "14 Sep" or "Sep". */
  label: string;
  /** Income booked in the bucket, in cents. */
  income: number;
  /** Expense booked in the bucket, in cents. */
  expense: number;
  /** How many transactions landed in the bucket. */
  count: number;
}

/** The bounds of a trend, as ISO `YYYY-MM-DD` strings. */
export interface TrendWindow {
  /** Inclusive first day of the range. */
  start: string;
  /** Inclusive last day of the range. */
  end: string;
}

/** Totals across a whole trend, in cents. */
export interface TrendTotals {
  income: number;
  expense: number;
  /** Income minus expense. */
  balance: number;
}

/** How many buckets each granularity shows by default. */
export const TREND_WINDOW_SIZES: Record<TrendGranularity, number> = {
  day: 30,
  week: 12,
  month: 12,
};

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MONTH_NAME = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const MONTH_YEAR_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

/** Whole days since the epoch for an ISO date, or `null` when it isn't one. */
function toDayNumber(value: string): number | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? null : Math.round(time / MS_PER_DAY);
}

/** The ISO `YYYY-MM-DD` string for a day number. */
function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The first day of the month a day number falls in, as a day number. */
function monthStartDay(day: number): number {
  const date = new Date(day * MS_PER_DAY);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / MS_PER_DAY;
}

/** The Monday of the week a day number falls in, as a day number. */
function weekStartDay(day: number): number {
  const weekday = new Date(day * MS_PER_DAY).getUTCDay();
  return day - ((weekday + 6) % 7);
}

/** A short label for a day, e.g. "14 Sep". */
function dayLabel(day: number): string {
  const date = new Date(day * MS_PER_DAY);
  return `${date.getUTCDate()} ${MONTH_NAME.format(date)}`;
}

/** A short label for a month, e.g. "Sep" or "Sep 26" when the year matters. */
function monthLabel(day: number, withYear: boolean): string {
  const date = new Date(day * MS_PER_DAY);
  return (withYear ? MONTH_YEAR_LABEL : MONTH_LABEL).format(date);
}

/** One bucket of the trend, with the days it covers. */
interface Bucket {
  key: string;
  label: string;
  /** First day of the bucket, as a day number. */
  startDay: number;
}

/**
 * The buckets that cover a range, one per day, week or month. The first and
 * last bucket start on the period the range begins or ends in, so a range that
 * starts mid-week still shows that whole week.
 */
function buildBuckets(
  startDay: number,
  endDay: number,
  granularity: TrendGranularity,
): Bucket[] {
  const buckets: Bucket[] = [];

  if (granularity === "day") {
    for (let day = startDay; day <= endDay; day += 1) {
      buckets.push({ key: fromDayNumber(day), label: dayLabel(day), startDay: day });
    }
    return buckets;
  }

  if (granularity === "week") {
    for (let start = weekStartDay(startDay); start <= endDay; start += 7) {
      buckets.push({ key: fromDayNumber(start), label: dayLabel(start), startDay: start });
    }
    return buckets;
  }

  const spansYears =
    new Date(startDay * MS_PER_DAY).getUTCFullYear() !==
    new Date(endDay * MS_PER_DAY).getUTCFullYear();

  let cursor = monthStartDay(startDay);
  while (cursor <= endDay) {
    const date = new Date(cursor * MS_PER_DAY);
    const next = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1,
    ) / MS_PER_DAY;
    buckets.push({
      key: fromDayNumber(cursor).slice(0, 7),
      label: monthLabel(cursor, spansYears),
      startDay: cursor,
    });
    cursor = next;
  }

  return buckets;
}

/** The bucket a day belongs to, as its first day. */
function bucketStartFor(day: number, granularity: TrendGranularity): number {
  if (granularity === "day") return day;
  if (granularity === "week") return weekStartDay(day);
  return monthStartDay(day);
}

/** The fields a transaction needs to be placed on a trend. */
type TrendTransaction = Pick<Transaction, "amount" | "type" | "occurredOn">;

/**
 * Bucket transactions into a spending trend: one point per day, week or month
 * across the given range, oldest first. Every bucket in the range is present,
 * even when nothing happened in it, so the line never skips a gap. Money math
 * stays in integer cents and no clock is read — the range is passed in — which
 * keeps the whole function pure and unit-testable.
 */
export function buildSpendingTrend(
  transactions: readonly TrendTransaction[],
  options: {
    granularity: TrendGranularity;
    /** Inclusive first day of the range, as an ISO `YYYY-MM-DD` string. */
    start: string;
    /** Inclusive last day of the range, as an ISO `YYYY-MM-DD` string. */
    end: string;
  },
): TrendPoint[] {
  const startDay = toDayNumber(options.start);
  const endDay = toDayNumber(options.end);

  if (startDay === null || endDay === null || endDay < startDay) return [];

  const buckets = buildBuckets(startDay, endDay, options.granularity);
  const positions = new Map<number, number>();
  buckets.forEach((bucket, index) => positions.set(bucket.startDay, index));

  const income = new Array<number>(buckets.length).fill(0);
  const expense = new Array<number>(buckets.length).fill(0);
  const counts = new Array<number>(buckets.length).fill(0);

  for (const transaction of transactions) {
    const day = toDayNumber(transaction.occurredOn);
    if (day === null || day < startDay || day > endDay) continue;

    const position = positions.get(
      bucketStartFor(day, options.granularity),
    );
    if (position === undefined) continue;

    if (transaction.type === "income") {
      income[position] += transaction.amount;
    } else {
      expense[position] += transaction.amount;
    }
    counts[position] += 1;
  }

  return buckets.map((bucket, index) => ({
    key: bucket.key,
    label: bucket.label,
    income: income[index],
    expense: expense[index],
    count: counts[index],
  }));
}

/**
 * The default range for a granularity, ending on the given day. Days look back
 * over {@link TREND_WINDOW_SIZES} days, weeks over that many weeks and months
 * over that many months. The day is passed in so the window stays pure.
 */
export function trendWindow(
  granularity: TrendGranularity,
  today: string,
): TrendWindow {
  const day = toDayNumber(today);
  if (day === null) return { start: today, end: today };

  if (granularity === "day") {
    return {
      start: fromDayNumber(day - (TREND_WINDOW_SIZES.day - 1)),
      end: today,
    };
  }

  if (granularity === "week") {
    return {
      start: fromDayNumber(
        weekStartDay(day) - (TREND_WINDOW_SIZES.week - 1) * 7,
      ),
      end: today,
    };
  }

  const date = new Date(day * MS_PER_DAY);
  return {
    start: fromDayNumber(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() - (TREND_WINDOW_SIZES.month - 1),
        1,
      ) / MS_PER_DAY,
    ),
    end: today,
  };
}

/** Income, expense and balance across a whole trend, in cents. */
export function trendTotals(points: readonly TrendPoint[]): TrendTotals {
  let income = 0;
  let expense = 0;

  for (const point of points) {
    income += point.income;
    expense += point.expense;
  }

  return { income, expense, balance: income - expense };
}

/** The average spend per bucket across a trend, in cents. */
export function trendAverage(points: readonly TrendPoint[]): number {
  if (points.length === 0) return 0;
  return Math.round(trendTotals(points).expense / points.length);
}

/**
 * The bucket with the most spending, or `null` when nothing was spent across
 * the trend.
 */
export function trendPeak(points: readonly TrendPoint[]): TrendPoint | null {
  let peak: TrendPoint | null = null;

  for (const point of points) {
    if (point.expense <= 0) continue;
    if (peak === null || point.expense > peak.expense) peak = point;
  }

  return peak;
}

import type { RecurrenceFrequency } from "@/types/recurring";
import { daysInMonth } from "./period";

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The fields a recurring transaction needs to compute its schedule. */
export interface RecurrenceSchedule {
  startOn: string;
  frequency: RecurrenceFrequency;
  interval: number;
  endOn?: string | null;
}

interface IsoParts {
  year: number;
  month: number;
  day: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function parseIsoDate(value: string): IsoParts | null {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function toDayNumber(value: string): number | null {
  const parts = parseIsoDate(value);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day) / MS_PER_DAY;
}

function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string | null {
  const dayNumber = toDayNumber(value);
  if (dayNumber === null) return null;
  return fromDayNumber(dayNumber + days);
}

/**
 * Add whole calendar months to an ISO date, clamping the day to the target
 * month's length (e.g. Jan 31 + 1 month → Feb 28, or Feb 29 in a leap year).
 */
function addMonths(value: string, months: number): string | null {
  const parts = parseIsoDate(value);
  if (!parts) return null;
  const zeroBased = parts.month - 1 + months;
  const year = parts.year + Math.floor(zeroBased / 12);
  const month = ((zeroBased % 12) + 12) % 12 + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function monthsBetween(start: IsoParts, end: IsoParts): number {
  return (end.year - start.year) * 12 + (end.month - start.month);
}

function normalizedInterval(interval: number): number | null {
  if (!Number.isFinite(interval)) return null;
  const whole = Math.floor(interval);
  return whole >= 1 ? whole : null;
}

function isOnOrBeforeEnd(candidate: string, endOn?: string | null): boolean {
  if (!endOn) return true;
  const end = parseIsoDate(endOn);
  return end === null || candidate <= endOn;
}

/**
 * The first occurrence strictly after `after`, or `null` when the schedule is
 * invalid or has already ended. Month and year steps clamp to real dates, so a
 * monthly plan starting Jan 31 lands on Feb 28/29 and returns to the 31st later.
 * All dates are passed in, so this stays pure (no implicit clock).
 */
export function nextOccurrence(
  schedule: RecurrenceSchedule,
  after: string,
): string | null {
  const start = parseIsoDate(schedule.startOn);
  const afterParts = parseIsoDate(after);
  const interval = normalizedInterval(schedule.interval);
  if (!start || !afterParts || interval === null) return null;

  const startDay = toDayNumber(schedule.startOn);
  const afterDay = toDayNumber(after);
  if (startDay === null || afterDay === null) return null;

  let candidate: string | null;

  switch (schedule.frequency) {
    case "daily":
    case "weekly": {
      const step = schedule.frequency === "weekly" ? interval * 7 : interval;
      const elapsed = afterDay - startDay;
      const index = elapsed < 0 ? 0 : Math.floor(elapsed / step) + 1;
      candidate = fromDayNumber(startDay + index * step);
      break;
    }
    case "monthly": {
      const step = interval;
      let index = Math.floor(monthsBetween(start, afterParts) / step);
      if (index < 0) index = 0;
      candidate = addMonths(schedule.startOn, index * step);
      while (candidate !== null && candidate <= after) {
        index += 1;
        candidate = addMonths(schedule.startOn, index * step);
      }
      break;
    }
    case "yearly": {
      const step = interval * 12;
      let index = Math.floor((afterParts.year - start.year) / interval);
      if (index < 0) index = 0;
      candidate = addMonths(schedule.startOn, index * step);
      while (candidate !== null && candidate <= after) {
        index += 1;
        candidate = addMonths(schedule.startOn, index * step);
      }
      break;
    }
    default:
      return null;
  }

  if (candidate === null || !isOnOrBeforeEnd(candidate, schedule.endOn)) {
    return null;
  }
  return candidate;
}

/**
 * Every occurrence inside an inclusive range, oldest first. An invalid or
 * inverted range yields an empty list, as does a schedule that never overlaps
 * it. The range dates are passed in, so no clock is read.
 */
export function occurrencesBetween(
  schedule: RecurrenceSchedule,
  from: string,
  to: string,
): string[] {
  const fromParts = parseIsoDate(from);
  const toParts = parseIsoDate(to);
  if (!fromParts || !toParts || from > to) return [];

  const beforeFrom = addDays(from, -1);
  if (beforeFrom === null) return [];

  const result: string[] = [];
  let cursor = nextOccurrence(schedule, beforeFrom);
  while (cursor !== null && cursor <= to) {
    result.push(cursor);
    cursor = nextOccurrence(schedule, cursor);
  }
  return result;
}

/**
 * The next `count` occurrences strictly after `after`, oldest first. Stops early
 * when the schedule ends, and returns an empty list for a non-positive count.
 */
export function upcomingOccurrences(
  schedule: RecurrenceSchedule,
  after: string,
  count: number,
): string[] {
  if (!Number.isFinite(count)) return [];
  const limit = Math.floor(count);
  if (limit < 1) return [];

  const result: string[] = [];
  let cursor = after;
  for (let index = 0; index < limit; index += 1) {
    const next = nextOccurrence(schedule, cursor);
    if (next === null) break;
    result.push(next);
    cursor = next;
  }
  return result;
}

/** True when `date` is one of the schedule's occurrences. */
export function isOccurrenceOn(
  schedule: RecurrenceSchedule,
  date: string,
): boolean {
  const previousDay = addDays(date, -1);
  if (previousDay === null) return false;
  return nextOccurrence(schedule, previousDay) === date;
}

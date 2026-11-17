import type { Category } from "@/types/category";
import type { RecurringTransaction } from "@/types/recurring";
import { budgetAlerts } from "./budget-alert";
import type { BudgetSummaryRow } from "./budget-summary";
import { isIsoDate } from "./date-range";
import { formatCurrency } from "./format";
import { nextOccurrence } from "./recurring";

/** What raised a notification: a budget crossing a limit, or an upcoming plan. */
export type NotificationKind = "budget" | "reminder";

/** How urgent a notification is; drives the icon and colour in the center. */
export type NotificationTone = "danger" | "warning" | "info";

/** One row in the in-app notification center, ready to render. */
export interface AppNotification {
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  title: string;
  message: string;
  /** The page that lets the user act on it. */
  href: string;
  /** The occurrence date for reminders, as an ISO `YYYY-MM-DD` string. */
  date?: string;
}

/** How many days ahead of today count as an upcoming reminder by default. */
export const DEFAULT_REMINDER_DAYS = 7;

const MS_PER_DAY = 86_400_000;

export interface ReminderOptions {
  /** Currency the amount is shown in; falls back to the formatting default. */
  currency?: string;
  /** How many days ahead to look for occurrences. Defaults to a week. */
  daysAhead?: number;
}

export interface NotificationInput {
  budgets: readonly BudgetSummaryRow[];
  recurring?: readonly RecurringTransaction[];
  categories?: readonly Category[];
  /** The local calendar date, as an ISO `YYYY-MM-DD` string. */
  today: string;
  currency?: string;
  /** Overrides {@link DEFAULT_REMINDER_DAYS}. */
  reminderDays?: number;
}

function toDayNumber(value: string): number | null {
  if (!isIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function shiftIsoDate(value: string, days: number): string | null {
  const day = toDayNumber(value);
  if (day === null) return null;
  return new Date((day + days) * MS_PER_DAY).toISOString().slice(0, 10);
}

function daysUntil(from: string, to: string): number | null {
  const start = toDayNumber(from);
  const end = toDayNumber(to);
  if (start === null || end === null) return null;
  return Math.round(end - start);
}

function dueLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function normalizedDays(value: number | undefined): number | null {
  if (value === undefined) return DEFAULT_REMINDER_DAYS;
  if (!Number.isFinite(value)) return null;
  const whole = Math.floor(value);
  return whole >= 0 ? whole : null;
}

/**
 * One notification per budget that is already over its limit or closing in on
 * it this month. Over-budget warnings come first and amounts stay in the user's
 * display currency, so the list mirrors the budget page's own alert order.
 */
export function buildBudgetNotifications(
  rows: readonly BudgetSummaryRow[],
  currency?: string,
): AppNotification[] {
  return budgetAlerts(rows).map((alert) => {
    const over = alert.level === "over";
    return {
      id: `budget-${alert.level}-${alert.id}`,
      kind: "budget",
      tone: over ? "danger" : "warning",
      title: over
        ? `${alert.categoryName} is over budget`
        : `${alert.categoryName} is near its limit`,
      message: over
        ? `Over by ${formatCurrency(alert.amount, currency)} — time to review the limit.`
        : `${alert.percent}% used · ${formatCurrency(alert.amount, currency)} left this month.`,
      href: "/dashboard/budgets",
    };
  });
}

/**
 * Reminders for recurring plans landing between today and `daysAhead` days from
 * now. Today's occurrences count, ended plans are dropped, and the result is
 * ordered by date so the next thing due is always at the top. All dates are
 * passed in, so this stays pure.
 */
export function buildReminderNotifications(
  recurring: readonly RecurringTransaction[],
  categories: readonly Category[],
  today: string,
  options: ReminderOptions = {},
): AppNotification[] {
  const daysAhead = normalizedDays(options.daysAhead);
  const windowEnd = shiftIsoDate(today, daysAhead ?? 0);
  const dayBefore = shiftIsoDate(today, -1);
  if (daysAhead === null || windowEnd === null || dayBefore === null) return [];

  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );

  return recurring
    .flatMap((entry): AppNotification[] => {
      const next = nextOccurrence(entry, dayBefore);
      if (next === null || next > windowEnd) return [];

      const days = daysUntil(today, next);
      if (days === null) return [];

      const categoryName = categoryById.get(entry.categoryId)?.name;
      const label =
        entry.note?.trim() ||
        categoryName ||
        (entry.type === "income" ? "Recurring income" : "Recurring expense");

      return [
        {
          id: `reminder-${entry.id}-${next}`,
          kind: "reminder",
          tone: "info",
          title: `${
            entry.type === "income" ? "Upcoming income" : "Upcoming payment"
          } · ${label}`,
          message: `${formatCurrency(entry.amount, options.currency)} due ${dueLabel(days)}`,
          href: "/dashboard/recurring",
          date: next,
        },
      ];
    })
    .sort((a, b) => {
      const byDate = (a.date ?? "").localeCompare(b.date ?? "");
      return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
    });
}

/**
 * Everything the notification center should show right now: budget warnings
 * first, then upcoming recurring plans. An empty list means the user is all
 * caught up.
 */
export function buildNotifications(input: NotificationInput): AppNotification[] {
  return [
    ...buildBudgetNotifications(input.budgets, input.currency),
    ...buildReminderNotifications(
      input.recurring ?? [],
      input.categories ?? [],
      input.today,
      {
        currency: input.currency,
        daysAhead: input.reminderDays,
      },
    ),
  ];
}

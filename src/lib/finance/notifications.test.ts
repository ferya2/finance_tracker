import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { RecurringTransaction } from "@/types/recurring";
import type { BudgetSummaryRow } from "./budget-summary";
import {
  buildBudgetNotifications,
  buildNotifications,
  buildReminderNotifications,
} from "./notifications";

function budgetRow(
  overrides: Partial<BudgetSummaryRow> = {},
): BudgetSummaryRow {
  return {
    id: "budget-1",
    categoryId: "cat-food",
    categoryName: "Food",
    categoryColor: "#e11d48",
    limit: 10000,
    spent: 5000,
    remaining: 5000,
    percent: 50,
    overBudget: false,
    ...overrides,
  };
}

const CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food", color: "#e11d48", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
];

function recurringEntry(
  overrides: Partial<RecurringTransaction> = {},
): RecurringTransaction {
  return {
    id: "rec-1",
    amount: 1299,
    type: "expense",
    categoryId: "cat-food",
    note: "Streaming",
    startOn: "2026-01-01",
    frequency: "monthly",
    interval: 1,
    ...overrides,
  };
}

describe("buildBudgetNotifications", () => {
  it("raises a danger notification for an over-budget category", () => {
    const [notification] = buildBudgetNotifications([
      budgetRow({
        id: "budget-food",
        spent: 12500,
        remaining: -2500,
        percent: 125,
        overBudget: true,
      }),
    ]);

    expect(notification).toMatchObject({
      id: "budget-over-budget-food",
      kind: "budget",
      tone: "danger",
      title: "Food is over budget",
      href: "/dashboard/budgets",
    });
    expect(notification.message).toContain("$25.00");
  });

  it("raises a warning for a budget close to its limit", () => {
    const [notification] = buildBudgetNotifications([
      budgetRow({ spent: 9000, remaining: 1000, percent: 90 }),
    ]);

    expect(notification.tone).toBe("warning");
    expect(notification.title).toBe("Food is near its limit");
    expect(notification.message).toContain("90%");
    expect(notification.message).toContain("$10.00");
  });

  it("drops budgets that are comfortably funded", () => {
    expect(buildBudgetNotifications([budgetRow()])).toEqual([]);
  });

  it("puts over-budget warnings before near-limit ones", () => {
    const notifications = buildBudgetNotifications([
      budgetRow({
        id: "warning",
        categoryName: "Transport",
        percent: 85,
        remaining: 1500,
      }),
      budgetRow({
        id: "over",
        categoryName: "Food",
        percent: 140,
        remaining: -4000,
        overBudget: true,
      }),
    ]);

    expect(notifications.map((item) => item.tone)).toEqual([
      "danger",
      "warning",
    ]);
  });
});

describe("buildReminderNotifications", () => {
  it("includes a plan due today and labels it", () => {
    const [notification] = buildReminderNotifications(
      [recurringEntry({ startOn: "2026-03-15" })],
      CATEGORIES,
      "2026-03-15",
    );

    expect(notification).toMatchObject({
      kind: "reminder",
      tone: "info",
      title: "Upcoming payment · Streaming",
      message: "$12.99 due today",
      href: "/dashboard/recurring",
      date: "2026-03-15",
    });
  });

  it("finds the next occurrence inside the window and orders by date", () => {
    const notifications = buildReminderNotifications(
      [
        recurringEntry({ id: "later", startOn: "2026-03-18", note: "Rent" }),
        recurringEntry({ id: "sooner", startOn: "2026-03-16", note: "Music" }),
        recurringEntry({
          id: "outside",
          startOn: "2026-04-01",
          note: "Insurance",
        }),
      ],
      CATEGORIES,
      "2026-03-15",
    );

    expect(notifications.map((item) => item.id)).toEqual([
      "reminder-sooner-2026-03-16",
      "reminder-later-2026-03-18",
    ]);
    expect(notifications[0].message).toBe("$12.99 due tomorrow");
    expect(notifications[1].message).toBe("$12.99 due in 3 days");
  });

  it("uses the category name when a plan has no note", () => {
    const [notification] = buildReminderNotifications(
      [recurringEntry({ note: undefined, startOn: "2026-03-16" })],
      CATEGORIES,
      "2026-03-15",
    );

    expect(notification.title).toBe("Upcoming payment · Food");
  });

  it("labels income plans as upcoming income", () => {
    const [notification] = buildReminderNotifications(
      [
        recurringEntry({
          type: "income",
          categoryId: "cat-salary",
          note: "Payday",
          startOn: "2026-03-16",
        }),
      ],
      CATEGORIES,
      "2026-03-15",
    );

    expect(notification.title).toBe("Upcoming income · Payday");
  });

  it("drops ended plans and occurrences past the window", () => {
    const notifications = buildReminderNotifications(
      [
        recurringEntry({ id: "ended", startOn: "2026-01-01", endOn: "2026-01-31" }),
        recurringEntry({ id: "later", startOn: "2026-03-20" }),
      ],
      CATEGORIES,
      "2026-03-15",
      { daysAhead: 2 },
    );

    expect(notifications).toEqual([]);
  });

  it("ignores an invalid reference date", () => {
    expect(
      buildReminderNotifications([recurringEntry()], CATEGORIES, "not-a-date"),
    ).toEqual([]);
  });

  it("treats a zero-day window as today only", () => {
    const notifications = buildReminderNotifications(
      [
        recurringEntry({ id: "today", startOn: "2026-03-15" }),
        recurringEntry({ id: "tomorrow", startOn: "2026-03-16" }),
      ],
      CATEGORIES,
      "2026-03-15",
      { daysAhead: 0 },
    );

    expect(notifications.map((item) => item.id)).toEqual([
      "reminder-today-2026-03-15",
    ]);
  });
});

describe("buildNotifications", () => {
  it("combines budget warnings and reminders", () => {
    const notifications = buildNotifications({
      budgets: [
        budgetRow({
          id: "budget-food",
          spent: 12000,
          remaining: -2000,
          percent: 120,
          overBudget: true,
        }),
      ],
      recurring: [recurringEntry({ startOn: "2026-03-16" })],
      categories: CATEGORIES,
      today: "2026-03-15",
    });

    expect(notifications.map((item) => item.kind)).toEqual([
      "budget",
      "reminder",
    ]);
  });

  it("returns an empty list when everything is on track", () => {
    expect(
      buildNotifications({
        budgets: [budgetRow()],
        recurring: [],
        categories: CATEGORIES,
        today: "2026-03-15",
      }),
    ).toEqual([]);
  });
});

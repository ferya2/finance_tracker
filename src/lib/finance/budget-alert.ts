import { BUDGET_WARNING_PERCENT } from "./budget";
import type { BudgetSummaryRow } from "./budget-summary";
import { formatCurrency } from "./format";

/** How a budget is misbehaving: already exceeded, or closing in on its limit. */
export type BudgetAlertLevel = "warning" | "over";

/** One budget worth flagging, with the numbers a badge or toast needs. */
export interface BudgetAlert {
  id: string;
  categoryName: string;
  level: BudgetAlertLevel;
  /** Spent as a share of the limit; may exceed 100. */
  percent: number;
  /** Cents over the limit when over budget, or the headroom left when warning. */
  amount: number;
}

/**
 * Every budget that needs attention this month, worst first: the ones already
 * over their limit, then the ones within {@link BUDGET_WARNING_PERCENT} of it.
 * Over-budget rows come first, each group ordered by how much of the limit is
 * used, so the same month always produces the same list. Budgets that are
 * comfortably funded — or untouched — are dropped.
 */
export function budgetAlerts(
  rows: readonly BudgetSummaryRow[],
): BudgetAlert[] {
  return rows
    .filter((row) => row.overBudget || row.percent >= BUDGET_WARNING_PERCENT)
    .map((row): BudgetAlert => ({
      id: row.id,
      categoryName: row.categoryName,
      level: row.overBudget ? "over" : "warning",
      percent: row.percent,
      amount: row.overBudget ? Math.abs(row.remaining) : row.remaining,
    }))
    .sort((a, b) => {
      if (a.level !== b.level) return a.level === "over" ? -1 : 1;
      return b.percent - a.percent;
    });
}

/**
 * A one-line message for the month's alerts, or `null` when nothing needs
 * attention. A lone budget is named and quantified; several are counted so the
 * message stays a glance, never a paragraph.
 */
export function budgetAlertMessage(
  alerts: readonly BudgetAlert[],
): string | null {
  if (alerts.length === 0) return null;

  if (alerts.length === 1) {
    const [alert] = alerts;
    return alert.level === "over"
      ? `${alert.categoryName} is over budget by ${formatCurrency(alert.amount)}`
      : `${alert.categoryName} is close to its limit (${alert.percent}% used)`;
  }

  const over = alerts.filter((alert) => alert.level === "over").length;
  const near = alerts.length - over;
  const parts: string[] = [];
  if (over > 0) parts.push(`${over} over budget`);
  if (near > 0) parts.push(`${near} near the limit`);

  return `Budget alert: ${parts.join(" · ")}`;
}

import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { monthKey } from "./period";
import { summarizeMonthly } from "./monthly";
import { sumByCategory } from "./by-category";

const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

export interface MonthlyReportCategoryRow {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  monthKey: string;
  income: number;
  expense: number;
  balance: number;
  categories: MonthlyReportCategoryRow[];
  transactions: readonly Transaction[];
}

/**
 * Build a composed monthly report from raw data. All money math delegates to
 * pure helpers and the period is passed in, so this stays unit-testable.
 */
export function buildMonthlyReport(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  year: number,
  month: number,
): MonthlyReport {
  const key = monthKey(year, month);
  const summary = summarizeMonthly(transactions, year, month);
  const lookup = new Map(categories.map((category) => [category.id, category]));

  const inMonth = transactions.filter((transaction) =>
    transaction.occurredOn.startsWith(key),
  );

  const categoriesRows = sumByCategory(inMonth, "expense")
    .map(({ categoryId, total }) => {
      const category = lookup.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        amount: total,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    year,
    month,
    monthKey: key,
    income: summary.income,
    expense: summary.expense,
    balance: summary.balance,
    categories: categoriesRows,
    transactions: inMonth,
  };
}

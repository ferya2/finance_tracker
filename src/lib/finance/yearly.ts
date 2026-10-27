import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { sumByCategory } from "./by-category";
import { summarizeMonthly } from "./monthly";
import {
  daysInMonth,
  formatMonthLabel,
  formatMonthName,
  monthKey,
  type YearMonth,
} from "./period";

const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

export interface YearlyMonth {
  period: YearMonth;
  monthKey: string;
  monthName: string;
  monthLabel: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface YearlyCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  sharePercent: number;
}

export interface YearlyReportSource {
  transactions: readonly Transaction[];
  categories: readonly Category[];
  budgets?: readonly Budget[];
}

export interface YearlyReport {
  year: number;
  monthCount: number;
  months: YearlyMonth[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  averageMonthlyBalance: number;
  categories: YearlyCategoryBreakdown[];
  topCategory: YearlyCategoryBreakdown | null;
  totalDays: number;
  dailyAverageExpense: number;
}

function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

function buildMonths(
  transactions: readonly Transaction[],
  year: number,
): YearlyMonth[] {
  const months: YearlyMonth[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const key = monthKey(year, month);
    const summary = summarizeMonthly(transactions, year, month);
    const inMonth = transactions.filter((transaction) =>
      transaction.occurredOn.startsWith(key),
    );
    months.push({
      period: { year, month },
      monthKey: key,
      monthName: formatMonthName(year, month),
      monthLabel: formatMonthLabel(year, month),
      income: summary.income,
      expense: summary.expense,
      net: summary.balance,
      transactionCount: inMonth.length,
    });
  }
  return months;
}

export function buildYearlyReport(
  source: YearlyReportSource,
  year: number,
): YearlyReport {
  const { transactions, categories } = source;
  const months = buildMonths(transactions, year);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const month of months) {
    totalIncome += month.income;
    totalExpense += month.expense;
  }
  const totalBalance = totalIncome - totalExpense;

  const monthCount = months.length || 12;
  const averageMonthlyIncome = Math.round(totalIncome / monthCount);
  const averageMonthlyExpense = Math.round(totalExpense / monthCount);
  const averageMonthlyBalance = Math.round(totalBalance / monthCount);

  const yearPrefix = String(year);
  const inYear = transactions.filter((transaction) =>
    transaction.occurredOn.startsWith(yearPrefix),
  );
  const lookup = new Map(
    categories.map((category) => [category.id, category]),
  );
  const categoriesBreakdown = sumByCategory(inYear, "expense").map(
    ({ categoryId, total }) => {
      const category = lookup.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        amount: total,
        sharePercent: sharePercent(total, totalExpense),
      };
    },
  );

  let totalDays = 0;
  for (let month = 1; month <= 12; month += 1) {
    totalDays += daysInMonth(year, month);
  }
  const dailyAverageExpense = totalDays > 0 ? Math.round(totalExpense / totalDays) : 0;

  return {
    year,
    monthCount,
    months,
    totalIncome,
    totalExpense,
    totalBalance,
    averageMonthlyIncome,
    averageMonthlyExpense,
    averageMonthlyBalance,
    categories: categoriesBreakdown,
    topCategory: categoriesBreakdown[0] ?? null,
    totalDays,
    dailyAverageExpense,
  };
}

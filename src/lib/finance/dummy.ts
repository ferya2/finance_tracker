import type { TransactionType } from "@/types/transaction";

/**
 * Hardcoded placeholder data for the Day 18 dummy dashboard. Real data is
 * wired into these widgets in Weeks 4-5. Everything here is pure so it can be
 * unit-tested; amounts are integer cents.
 */

export interface DummyCategory {
  id: string;
  name: string;
  color: string;
  kind: TransactionType;
}

export interface DummySummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export interface DummyRecentTransaction {
  id: string;
  categoryId: string;
  note: string;
  amount: number;
  type: TransactionType;
  occurredOn: string;
}

export interface DummyCategoryBreakdown {
  categoryId: string;
  amount: number;
  /** Precomputed share of the monthly expense, 0-100. */
  sharePercent: number;
}

export interface DummyBudget {
  id: string;
  categoryId: string;
  limit: number;
  spent: number;
  /** Precomputed spent/limit, 0-100 (may exceed 100 when over budget). */
  percent: number;
}

export interface DummyCategoryTotal {
  categoryId: string;
  type: TransactionType;
  /** Amount spent/earned in that category this month, in cents. */
  amount: number;
}

export interface DummyMonthlyPoint {
  /** Short x-axis label, e.g. "Apr". */
  month: string;
  income: number;
  expense: number;
  /** Precomputed income - expense, in cents. */
  balance: number;
}

export interface DummyInsights {
  averageDailySpend: number;
  biggestExpenseNote: string;
  biggestExpenseAmount: number;
  /** Share of income kept, 0-100. */
  savingsRatePercent: number;
  /** Spending vs the previous month: positive means less, in percent. */
  spendingTrendPercent: number;
  tips: string[];
}

export const DUMMY_CATEGORIES: DummyCategory[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-freelance", name: "Freelance", color: "#0d9488", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-transport", name: "Transport", color: "#0284c7", kind: "expense" },
  { id: "cat-shopping", name: "Shopping", color: "#7c3aed", kind: "expense" },
  { id: "cat-utilities", name: "Utilities", color: "#059669", kind: "expense" },
  { id: "cat-entertainment", name: "Entertainment", color: "#db2777", kind: "expense" },
];

export const DUMMY_SUMMARY: DummySummary = {
  totalBalance: 482150,
  monthlyIncome: 685000,
  monthlyExpense: 202850,
};

export const DUMMY_CATEGORY_BREAKDOWN: DummyCategoryBreakdown[] = [
  { categoryId: "cat-housing", amount: 115000, sharePercent: 57 },
  { categoryId: "cat-food", amount: 38240, sharePercent: 19 },
  { categoryId: "cat-transport", amount: 21560, sharePercent: 11 },
  { categoryId: "cat-shopping", amount: 12075, sharePercent: 6 },
  { categoryId: "cat-utilities", amount: 9790, sharePercent: 5 },
  { categoryId: "cat-entertainment", amount: 6185, sharePercent: 3 },
];

export const DUMMY_BUDGETS: DummyBudget[] = [
  { id: "budget-housing", categoryId: "cat-housing", limit: 130000, spent: 115000, percent: 88 },
  { id: "budget-food", categoryId: "cat-food", limit: 35000, spent: 38240, percent: 109 },
  { id: "budget-transport", categoryId: "cat-transport", limit: 25000, spent: 21560, percent: 86 },
  { id: "budget-shopping", categoryId: "cat-shopping", limit: 15000, spent: 12075, percent: 81 },
  { id: "budget-utilities", categoryId: "cat-utilities", limit: 12000, spent: 9790, percent: 82 },
];

export const DUMMY_RECENT_TRANSACTIONS: DummyRecentTransaction[] = [
  { id: "txn-1", categoryId: "cat-salary", note: "Monthly salary", amount: 240000, type: "income", occurredOn: "2026-09-01" },
  { id: "txn-2", categoryId: "cat-freelance", note: "Design project", amount: 145000, type: "income", occurredOn: "2026-09-03" },
  { id: "txn-3", categoryId: "cat-housing", note: "Rent", amount: 115000, type: "expense", occurredOn: "2026-09-04" },
  { id: "txn-4", categoryId: "cat-food", note: "Weekly groceries", amount: 8635, type: "expense", occurredOn: "2026-09-10" },
  { id: "txn-5", categoryId: "cat-utilities", note: "Internet bill", amount: 4990, type: "expense", occurredOn: "2026-09-11" },
  { id: "txn-6", categoryId: "cat-entertainment", note: "Cinema night", amount: 2450, type: "expense", occurredOn: "2026-09-12" },
];

/**
 * The full September transaction log. `DUMMY_RECENT_TRANSACTIONS` is the first
 * six rows (kept for the dashboard widget); these rows reconcile exactly with
 * the category breakdown, monthly summary and budget numbers above.
 */
export const DUMMY_TRANSACTIONS: DummyRecentTransaction[] = [
  ...DUMMY_RECENT_TRANSACTIONS,
  { id: "txn-7", categoryId: "cat-food", note: "Grocery haul", amount: 12050, type: "expense", occurredOn: "2026-09-06" },
  { id: "txn-8", categoryId: "cat-transport", note: "Fuel top-up", amount: 12400, type: "expense", occurredOn: "2026-09-08" },
  { id: "txn-9", categoryId: "cat-freelance", note: "Landing concept", amount: 120000, type: "income", occurredOn: "2026-09-10" },
  { id: "txn-10", categoryId: "cat-shopping", note: "Laptop stand", amount: 5075, type: "expense", occurredOn: "2026-09-12" },
  { id: "txn-11", categoryId: "cat-food", note: "Takeout dinner", amount: 8455, type: "expense", occurredOn: "2026-09-14" },
  { id: "txn-12", categoryId: "cat-transport", note: "Train pass", amount: 9160, type: "expense", occurredOn: "2026-09-16" },
  { id: "txn-13", categoryId: "cat-freelance", note: "Web audit", amount: 180000, type: "income", occurredOn: "2026-09-17" },
  { id: "txn-14", categoryId: "cat-shopping", note: "Sneakers", amount: 7000, type: "expense", occurredOn: "2026-09-18" },
  { id: "txn-15", categoryId: "cat-entertainment", note: "Streaming", amount: 1690, type: "expense", occurredOn: "2026-09-19" },
  { id: "txn-16", categoryId: "cat-food", note: "Coffee run", amount: 9100, type: "expense", occurredOn: "2026-09-20" },
  { id: "txn-17", categoryId: "cat-utilities", note: "Electricity", amount: 4800, type: "expense", occurredOn: "2026-09-21" },
  { id: "txn-18", categoryId: "cat-entertainment", note: "Concert tickets", amount: 2045, type: "expense", occurredOn: "2026-09-22" },
];

/** Per-category totals for September — expenses reconcile with the breakdown. */
export const DUMMY_CATEGORY_TOTALS: DummyCategoryTotal[] = [
  { categoryId: "cat-salary", type: "income", amount: 240000 },
  { categoryId: "cat-freelance", type: "income", amount: 445000 },
  { categoryId: "cat-housing", type: "expense", amount: 115000 },
  { categoryId: "cat-food", type: "expense", amount: 38240 },
  { categoryId: "cat-transport", type: "expense", amount: 21560 },
  { categoryId: "cat-shopping", type: "expense", amount: 12075 },
  { categoryId: "cat-utilities", type: "expense", amount: 9790 },
  { categoryId: "cat-entertainment", type: "expense", amount: 6185 },
];

/** Six-month history for the reports charts (Apr → Sep 2026). */
export const DUMMY_MONTHLY_SERIES: DummyMonthlyPoint[] = [
  { month: "Apr", income: 620000, expense: 245000, balance: 375000 },
  { month: "May", income: 655000, expense: 232500, balance: 422500 },
  { month: "Jun", income: 595000, expense: 258000, balance: 337000 },
  { month: "Jul", income: 670000, expense: 220500, balance: 449500 },
  { month: "Aug", income: 688000, expense: 210750, balance: 477250 },
  { month: "Sep", income: 685000, expense: 202850, balance: 482150 },
];

export const DUMMY_INSIGHTS: DummyInsights = {
  averageDailySpend: 6762,
  biggestExpenseNote: "Rent",
  biggestExpenseAmount: 115000,
  savingsRatePercent: 70,
  spendingTrendPercent: 4,
  tips: [
    "You spent 4% less in September than in August.",
    "Food & dining is your fastest-growing category.",
    "Saving 70% of what you earn keeps you well ahead of your budget.",
  ],
};

/** Look up a dummy category by id. */
export function getDummyCategory(categoryId: string): DummyCategory | undefined {
  return DUMMY_CATEGORIES.find((category) => category.id === categoryId);
}
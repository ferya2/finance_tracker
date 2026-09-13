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

/** Look up a dummy category by id. */
export function getDummyCategory(categoryId: string): DummyCategory | undefined {
  return DUMMY_CATEGORIES.find((category) => category.id === categoryId);
}
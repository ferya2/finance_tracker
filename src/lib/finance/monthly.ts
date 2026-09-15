import type { Transaction } from "@/types/transaction";
import { balance, sumExpense, sumIncome } from "./totals";

/** Income, expense and balance for a single month, all in integer cents. */
export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
}

/** The fields a transaction needs for monthly filtering. */
type DateAndAmountsAndType = Pick<
  Transaction,
  "occurredOn" | "amount" | "type"
>;

/**
 * Summarize a list of transactions for one calendar month. `month` is 1-12;
 * transactions on any other month/year are ignored. An empty or unmatched
 * list yields a summary of all zeros.
 */
export function summarizeMonthly(
  transactions: readonly DateAndAmountsAndType[],
  year: number,
  month: number,
): MonthlySummary {
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const inMonth = transactions.filter((transaction) =>
    transaction.occurredOn.startsWith(monthPrefix),
  );
  return {
    income: sumIncome(inMonth),
    expense: sumExpense(inMonth),
    balance: balance(inMonth),
  };
}
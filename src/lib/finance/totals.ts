import type { Transaction } from "@/types/transaction";

/** The fields a transaction needs for total calculations. */
type AmountAndType = Pick<Transaction, "amount" | "type">;

/**
 * Sum the amounts of all income transactions. Income is counted as a positive
 * sum, so an empty list yields `0`.
 */
export function sumIncome(transactions: readonly AmountAndType[]): number {
  return transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

/** Sum the amounts of all expense transactions (an empty list yields `0`). */
export function sumExpense(transactions: readonly AmountAndType[]): number {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

/** Overall balance: total income minus total expense, in cents. */
export function balance(transactions: readonly AmountAndType[]): number {
  return sumIncome(transactions) - sumExpense(transactions);
}
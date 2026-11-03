import type { Account } from "@/types/account";
import type { Transaction } from "@/types/transaction";
import { balance, sumExpense, sumIncome } from "./totals";

/** The fields a transaction needs to affect an account balance. */
type AmountAndType = Pick<Transaction, "amount" | "type">;

/** The fields an account needs to total its balance. */
type BalanceAccount = Pick<Account, "openingBalance">;

/** A single account's balance broken down by where the money came from. */
export interface AccountBalance {
  accountId: string;
  /** Balance before any tracked transactions, in integer cents. */
  openingBalance: number;
  /** Income credited to the account, in integer cents. */
  income: number;
  /** Expenses charged to the account, in integer cents. */
  expense: number;
  /** Opening balance plus income minus expense, in integer cents. */
  balance: number;
}

/**
 * Current balance of one account: its opening balance plus income minus
 * expense across the transactions that belong to it. An empty list yields the
 * opening balance, and the result is in integer cents.
 */
export function accountBalance(
  account: BalanceAccount,
  transactions: readonly AmountAndType[],
): number {
  return account.openingBalance + balance(transactions);
}

/**
 * Compute detailed balances for many accounts at once. `transactionsByAccount`
 * maps an account id to that account's transactions; accounts without an entry
 * are treated as having no transactions. Rows keep the accounts' given order.
 */
export function accountBalances(
  accounts: readonly (BalanceAccount & Pick<Account, "id">)[],
  transactionsByAccount: Readonly<
    Record<string, readonly AmountAndType[]>
  > = {},
): AccountBalance[] {
  return accounts.map((account) => {
    const transactions = transactionsByAccount[account.id] ?? [];
    const income = sumIncome(transactions);
    const expense = sumExpense(transactions);
    return {
      accountId: account.id,
      openingBalance: account.openingBalance,
      income,
      expense,
      balance: account.openingBalance + income - expense,
    };
  });
}

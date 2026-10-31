import type { TransactionType } from "./transaction";

/** How often a recurring transaction repeats. */
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/**
 * A template for transactions that repeat on a schedule. `amount` is an integer
 * number of cents and dates are ISO `YYYY-MM-DD` strings.
 */
export interface RecurringTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note?: string;
  /** First occurrence, as an ISO `YYYY-MM-DD` string. */
  startOn: string;
  /** How often the transaction repeats. */
  frequency: RecurrenceFrequency;
  /** Repeat every N frequency units; must be a positive integer. */
  interval: number;
  /** Last possible occurrence (inclusive); omit for an open-ended plan. */
  endOn?: string | null;
}

/** Shape accepted when creating a recurring transaction (`id` is assigned by the database). */
export type NewRecurringTransaction = Omit<RecurringTransaction, "id">;

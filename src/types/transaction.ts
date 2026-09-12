export type TransactionType = "income" | "expense";

/** A single transaction. `amount` is an integer number of cents. */
export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  note?: string;
  /** Calendar date the transaction occurred on, as an ISO `YYYY-MM-DD` string. */
  occurredOn: string;
}

/** Shape accepted when creating a transaction (`id` is assigned by the database). */
export type NewTransaction = Omit<Transaction, "id">;
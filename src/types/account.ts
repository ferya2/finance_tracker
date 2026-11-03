/** The kind of wallet or bank account a row represents. */
export type AccountKind = "checking" | "savings" | "cash" | "credit";

/**
 * A wallet or bank account. `openingBalance` is an integer number of cents
 * before any tracked transactions.
 */
export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  /** Balance before any tracked transactions, in integer cents. */
  openingBalance: number;
  /** Hex accent colour used for the account. */
  color: string;
}

/** Shape accepted when creating an account (`id` is assigned by the database). */
export type NewAccount = Omit<Account, "id">;

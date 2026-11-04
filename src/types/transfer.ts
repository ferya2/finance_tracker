/** A movement of money between two of the user's accounts. */
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  /** Amount moved, in integer cents. */
  amount: number;
  note?: string;
  /** Calendar day the transfer happened on, as an ISO `YYYY-MM-DD` string. */
  occurredOn: string;
}

/** Shape accepted when creating a transfer (`id` is assigned by the caller). */
export type NewTransfer = Omit<Transfer, "id">;

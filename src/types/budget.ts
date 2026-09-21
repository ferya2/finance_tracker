/** A category budget for one calendar month. `limitAmount` is in integer cents. */
export interface Budget {
  id: string;
  categoryId: string;
  /** Calendar month the budget applies to, as an ISO `YYYY-MM` string. */
  month: string;
  limitAmount: number;
}

/** Shape accepted when creating a budget (`id` is assigned by the database). */
export type NewBudget = Omit<Budget, "id">;
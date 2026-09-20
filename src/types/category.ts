import type { TransactionType } from "./transaction";

/** A spending/earning category. `color` is a hex string, `kind` its type. */
export interface Category {
  id: string;
  name: string;
  color: string;
  kind: TransactionType;
}

/** Shape accepted when creating a category (`id` is assigned by the database). */
export type NewCategory = Omit<Category, "id">;
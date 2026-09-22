import type { PostgrestError } from "@supabase/supabase-js";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { listBudgets } from "./budgets";
import { listCategories } from "./categories";
import { listTransactions } from "./transactions";

/** Everything needed to render the dashboard / user pages, fetched once. */
export interface UserData {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

export interface LoadUserDataResult {
  data: UserData | null;
  error: PostgrestError | null;
}

/**
 * Fetch all of the current user's transactions, categories and budgets in
 * parallel. Returns null data plus the first error when any of the three
 * reads fails.
 */
export async function loadUserData(): Promise<LoadUserDataResult> {
  const [transactions, categories, budgets] = await Promise.all([
    listTransactions(),
    listCategories(),
    listBudgets(),
  ]);

  const firstError =
    transactions.error ?? categories.error ?? budgets.error;

  if (firstError) {
    return { data: null, error: firstError };
  }

  return {
    data: {
      transactions: transactions.data ?? [],
      categories: categories.data ?? [],
      budgets: budgets.data ?? [],
    },
    error: null,
  };
}
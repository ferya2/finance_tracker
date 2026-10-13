import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

/** The fields a transaction needs to be matched against a category. */
type CategorizedTransaction = Pick<Transaction, "categoryId">;

/**
 * Where a deleted category's transactions move to. Only a sibling of the same
 * kind is safe — an expense category cannot adopt income transactions — and the
 * first such sibling in the given order wins, so the choice is deterministic.
 * Returns `null` when there is nowhere to put them.
 */
export function findReassignmentTarget(
  category: Category,
  categories: readonly Category[],
): Category | null {
  return (
    categories.find(
      (candidate) =>
        candidate.id !== category.id && candidate.kind === category.kind,
    ) ?? null
  );
}

/** How many transactions still point at a category. */
export function countLinkedTransactions(
  categoryId: string,
  transactions: readonly CategorizedTransaction[],
): number {
  return transactions.filter(
    (transaction) => transaction.categoryId === categoryId,
  ).length;
}

/** Everything the UI needs to know before a category can be removed. */
export interface CategoryDeletePlan {
  /** The category on its way out. */
  category: Category;
  /** How many transactions point at it. */
  linkedCount: number;
  /** Where those transactions move to; `null` when no sibling of its kind exists. */
  target: Category | null;
}

/**
 * Work out what deleting a category would involve: how many transactions use it
 * and, if any do, which sibling they would be reassigned to first. Pure and
 * side-effect free, so the UI can preview the outcome before asking the user.
 */
export function planCategoryDelete(
  category: Category,
  categories: readonly Category[],
  transactions: readonly CategorizedTransaction[],
): CategoryDeletePlan {
  return {
    category,
    linkedCount: countLinkedTransactions(category.id, transactions),
    target: findReassignmentTarget(category, categories),
  };
}

/**
 * Whether the delete can go ahead without stranding transactions. A category
 * with no transactions is always safe; one in use needs a sibling to adopt
 * them first.
 */
export function canDeleteCategory(plan: CategoryDeletePlan): boolean {
  return plan.linkedCount === 0 || plan.target !== null;
}

/** `1 transaction` / `3 transactions`, for messages that count them. */
function countLabel(count: number): string {
  return `${count} ${count === 1 ? "transaction" : "transactions"}`;
}

/**
 * The sentence shown under "Delete this category?" — what happens to the
 * category's transactions, or why the delete cannot proceed.
 */
export function describeCategoryDelete(plan: CategoryDeletePlan): string {
  const name = `"${plan.category.name}"`;

  if (plan.linkedCount === 0) {
    return `No transactions use ${name}, so it can be removed safely.`;
  }

  if (!plan.target) {
    return `${name} is used by ${countLabel(plan.linkedCount)} and there is no other ${plan.category.kind} category to move them to. Add one first.`;
  }

  return `${countLabel(plan.linkedCount)} will move to "${plan.target.name}" before ${name} is removed.`;
}

/**
 * What the confirmation snackbar says after a category is deleted and its
 * transactions (if any) have been reassigned.
 */
export function describeDeletedCategory(plan: CategoryDeletePlan): string {
  if (plan.linkedCount === 0 || !plan.target) {
    return `Deleted "${plan.category.name}".`;
  }

  return `Deleted "${plan.category.name}" · ${countLabel(plan.linkedCount)} moved to "${plan.target.name}".`;
}

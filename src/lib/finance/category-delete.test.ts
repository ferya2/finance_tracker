import { describe, expect, it } from "vitest";
import {
  canDeleteCategory,
  countLinkedTransactions,
  describeCategoryDelete,
  describeDeletedCategory,
  findReassignmentTarget,
  planCategoryDelete,
} from "./category-delete";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const FOOD: Category = {
  id: "cat-food",
  name: "Food & dining",
  color: "#e11d48",
  kind: "expense",
};

const HOUSING: Category = {
  id: "cat-housing",
  name: "Housing",
  color: "#d97706",
  kind: "expense",
};

const SALARY: Category = {
  id: "cat-salary",
  name: "Salary",
  color: "#059669",
  kind: "income",
};

const CATEGORIES: Category[] = [FOOD, HOUSING, SALARY];

const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    amount: 38240,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-10-02",
  },
  {
    id: "txn-2",
    amount: 1200,
    type: "expense",
    categoryId: "cat-food",
    occurredOn: "2026-10-05",
  },
  {
    id: "txn-3",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-10-01",
  },
];

describe("findReassignmentTarget", () => {
  it("picks the first other category of the same kind", () => {
    expect(findReassignmentTarget(FOOD, CATEGORIES)).toEqual(HOUSING);
  });

  it("never picks a category of the other kind", () => {
    expect(findReassignmentTarget(FOOD, [FOOD, SALARY])).toBeNull();
  });

  it("returns null when the category is alone", () => {
    expect(findReassignmentTarget(FOOD, [FOOD])).toBeNull();
  });

  it("does not pick the category being removed", () => {
    const target = findReassignmentTarget(FOOD, [FOOD, FOOD]);
    expect(target).not.toBe(FOOD);
  });
});

describe("countLinkedTransactions", () => {
  it("counts only the transactions pointing at the category", () => {
    expect(countLinkedTransactions("cat-food", TRANSACTIONS)).toBe(2);
  });

  it("is zero for a category with no transactions", () => {
    expect(countLinkedTransactions("cat-salary", TRANSACTIONS)).toBe(0);
  });
});

describe("planCategoryDelete", () => {
  it("reports the count and the reassignment target together", () => {
    expect(planCategoryDelete(FOOD, CATEGORIES, TRANSACTIONS)).toEqual({
      category: FOOD,
      linkedCount: 2,
      target: HOUSING,
    });
  });

  it("has no target when nothing of the same kind remains", () => {
    expect(planCategoryDelete(FOOD, [FOOD], TRANSACTIONS)).toEqual({
      category: FOOD,
      linkedCount: 2,
      target: null,
    });
  });
});

describe("canDeleteCategory", () => {
  it("allows deleting an unused category even with no sibling", () => {
    expect(canDeleteCategory(planCategoryDelete(SALARY, [SALARY], TRANSACTIONS))).toBe(
      true,
    );
  });

  it("allows deleting a used category that has a sibling", () => {
    expect(canDeleteCategory(planCategoryDelete(FOOD, CATEGORIES, TRANSACTIONS))).toBe(
      true,
    );
  });

  it("blocks deleting a used category with nowhere to move its rows", () => {
    expect(canDeleteCategory(planCategoryDelete(FOOD, [FOOD], TRANSACTIONS))).toBe(
      false,
    );
  });
});

describe("describeCategoryDelete", () => {
  it("says an unused category is safe to remove", () => {
    expect(
      describeCategoryDelete(planCategoryDelete(SALARY, CATEGORIES, TRANSACTIONS)),
    ).toBe('No transactions use "Salary", so it can be removed safely.');
  });

  it("explains the reassignment, pluralising the count", () => {
    expect(
      describeCategoryDelete(planCategoryDelete(FOOD, CATEGORIES, TRANSACTIONS)),
    ).toBe(
      '2 transactions will move to "Housing" before "Food & dining" is removed.',
    );
  });

  it("uses the singular for one linked transaction", () => {
    const single: Transaction[] = [
      {
        id: "txn",
        amount: 1,
        type: "expense",
        categoryId: "cat-food",
        occurredOn: "2026-10-01",
      },
    ];
    const plan = planCategoryDelete(FOOD, [FOOD, HOUSING], single);
    expect(describeCategoryDelete(plan)).toBe(
      '1 transaction will move to "Housing" before "Food & dining" is removed.',
    );
  });

  it("explains the block when there is no sibling to reassign to", () => {
    expect(
      describeCategoryDelete(planCategoryDelete(FOOD, [FOOD], TRANSACTIONS)),
    ).toBe(
      '"Food & dining" is used by 2 transactions and there is no other expense category to move them to. Add one first.',
    );
  });
});

describe("describeDeletedCategory", () => {
  it("names the reassignment in the confirmation", () => {
    expect(
      describeDeletedCategory(planCategoryDelete(FOOD, CATEGORIES, TRANSACTIONS)),
    ).toBe('Deleted "Food & dining" · 2 transactions moved to "Housing".');
  });

  it("stays simple when no transactions were involved", () => {
    expect(
      describeDeletedCategory(planCategoryDelete(SALARY, CATEGORIES, TRANSACTIONS)),
    ).toBe('Deleted "Salary".');
  });
});

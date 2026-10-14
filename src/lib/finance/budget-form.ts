import type { Budget, NewBudget } from "@/types/budget";
import type { Category } from "@/types/category";
import { formatAmountInput, parseAmount } from "./format";
import { monthKey } from "./period";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export interface BudgetFormValues {
  /** The category this budget applies to. */
  categoryId: string;
  /** Calendar month the budget applies to, as an ISO `YYYY-MM` string. */
  month: string;
  /** The typed limit amount, parsed into integer cents on submit. */
  limitAmount: string;
}

export interface BudgetErrors {
  categoryId?: string;
  month?: string;
  limitAmount?: string;
}

/** A blank budget form prefilling the given month (YYYY-MM). */
export function emptyBudgetForm(month: string): BudgetFormValues {
  return {
    categoryId: "",
    month,
    limitAmount: "",
  };
}

/** Prefill an edit form from a budget that is already saved. */
export function budgetToFormValues(budget: Budget): BudgetFormValues {
  return {
    categoryId: budget.categoryId,
    month: budget.month,
    limitAmount: formatAmountInput(budget.limitAmount),
  };
}

/**
 * Turn form values into the shape the database stores. The limit becomes
 * integer cents and text fields are trimmed. A limit that cannot be parsed
 * falls back to `0` so validation can reject it instead of saving silently.
 */
export function toNewBudget(values: BudgetFormValues): NewBudget {
  const limit = parseAmount(values.limitAmount) ?? 0;

  return {
    categoryId: values.categoryId.trim(),
    month: values.month.trim(),
    limitAmount: limit,
  };
}

/** The budget fields needed for an update (same shape as creation). */
export type BudgetUpdate = NewBudget;

/** Turn form values into the fields to write over a saved budget. */
export function toBudgetUpdate(values: BudgetFormValues): BudgetUpdate {
  return toNewBudget(values);
}

/**
 * Validate a budget form. The category is required, the month must be in
 * `YYYY-MM` format, and the limit must be a positive whole number of cents.
 */
export function validateBudgetForm(values: BudgetFormValues): BudgetErrors {
  const errors: BudgetErrors = {};
  const categoryId = values.categoryId.trim();
  const month = values.month.trim();

  if (categoryId.length === 0) {
    errors.categoryId = "Category is required.";
  }

  if (month.length === 0) {
    errors.month = "Month is required.";
  } else if (!MONTH_PATTERN.test(month)) {
    errors.month = "Month must be in YYYY-MM format.";
  } else {
    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const m = Number(monthStr);
    if (Number.isNaN(year) || year < 1) {
      errors.month = "Month must be in YYYY-MM format.";
    } else if (Number.isNaN(m) || m < 1 || m > 12) {
      errors.month = "Month must be a valid calendar month.";
    }
  }

  const limit = parseAmount(values.limitAmount);
  if (limit === null) {
    errors.limitAmount = "Amount must be a positive whole number of cents.";
  } else if (!Number.isInteger(limit)) {
    errors.limitAmount = "Amount must be a positive whole number of cents.";
  } else if (limit <= 0) {
    errors.limitAmount = "Amount must be greater than zero.";
  }

  return errors;
}

/** Return expense categories that can have a budget, in their existing order. */
export function budgetableCategories(categories: readonly Category[]): Category[] {
  return categories.filter((category) => category.kind === "expense");
}

/**
 * A month picker option: the `YYYY-MM` value a budget stores plus its human
 * label. `month` is 1-12.
 */
export interface MonthOption {
  value: string;
  label: string;
}

/**
 * The `count` calendar months starting at `year`/`month` (inclusive), each as a
 * {@link MonthOption} (e.g. September 2026 → `"2026-09"` / `"September 2026"`).
 * Formatting is pinned to UTC and the starting month is passed in, so this
 * stays pure and deterministic.
 */
export function buildMonthOptions(
  year: number,
  month: number,
  count: number = 12,
): MonthOption[] {
  const options: MonthOption[] = [];

  for (let i = 0; i < count; i++) {
    const offset = month - 1 + i;
    const optionYear = year + Math.floor(offset / 12);
    const optionMonth = (offset % 12) + 1;
    const date = new Date(Date.UTC(optionYear, optionMonth - 1, 1));

    options.push({
      value: monthKey(optionYear, optionMonth),
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
    });
  }

  return options;
}

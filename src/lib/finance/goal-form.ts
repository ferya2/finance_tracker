import type { NewSavingsGoal, SavingsGoal } from "@/types/goal";
import {
  CATEGORY_COLOR_PALETTE,
  isValidCategoryColor,
} from "./category-form";
import { formatAmountInput, parseAmount } from "./format";

export interface GoalFormValues {
  name: string;
  savedAmount: string;
  targetAmount: string;
  targetDate: string;
  color: string;
}

export interface GoalFormErrors {
  name?: string;
  savedAmount?: string;
  targetAmount?: string;
  targetDate?: string;
  color?: string;
}

export const GOAL_COLOR_PALETTE = CATEGORY_COLOR_PALETTE;

export const DEFAULT_GOAL_COLOR = GOAL_COLOR_PALETTE[3];

export const MAX_GOAL_NAME_LENGTH = 60;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function emptyGoalForm(
  color: string = DEFAULT_GOAL_COLOR,
): GoalFormValues {
  return {
    name: "",
    savedAmount: "",
    targetAmount: "",
    targetDate: "",
    color,
  };
}

export function goalToFormValues(goal: SavingsGoal): GoalFormValues {
  return {
    name: goal.name,
    savedAmount: formatAmountInput(goal.savedAmount),
    targetAmount: formatAmountInput(goal.targetAmount),
    targetDate: goal.targetDate ?? "",
    color: goal.color ?? DEFAULT_GOAL_COLOR,
  };
}

export function toNewGoal(values: GoalFormValues): NewSavingsGoal {
  const targetDate = values.targetDate.trim();
  const goal: NewSavingsGoal = {
    name: values.name.trim(),
    savedAmount: parseAmount(values.savedAmount) ?? 0,
    targetAmount: parseAmount(values.targetAmount) ?? 0,
    color: values.color,
  };

  if (targetDate.length > 0) {
    goal.targetDate = targetDate;
  }

  return goal;
}

export function validateGoalInput(input: NewSavingsGoal): GoalFormErrors {
  const errors: GoalFormErrors = {};
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_GOAL_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_GOAL_NAME_LENGTH} characters.`;
  }

  if (
    !Number.isInteger(input.targetAmount) ||
    input.targetAmount <= 0
  ) {
    errors.targetAmount = "Target must be greater than zero.";
  }

  if (!Number.isInteger(input.savedAmount) || input.savedAmount < 0) {
    errors.savedAmount = "Saved amount must be zero or more.";
  }

  if (
    input.targetDate !== undefined &&
    input.targetDate !== null &&
    input.targetDate !== ""
  ) {
    if (
      typeof input.targetDate !== "string" ||
      !isRealDate(input.targetDate)
    ) {
      errors.targetDate = "Target date must be a valid YYYY-MM-DD date.";
    }
  }

  if (input.color !== undefined && !isValidCategoryColor(input.color)) {
    errors.color = "Choose a valid colour.";
  }

  return errors;
}

export function validateGoalForm(values: GoalFormValues): GoalFormErrors {
  const errors: GoalFormErrors = {};
  const name = values.name.trim();

  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_GOAL_NAME_LENGTH) {
    errors.name = `Name must be at most ${MAX_GOAL_NAME_LENGTH} characters.`;
  }

  const savedRaw = values.savedAmount.trim();
  if (savedRaw.length > 0) {
    const saved = parseAmount(savedRaw);
    if (saved === null) {
      errors.savedAmount = "Enter a valid saved amount.";
    } else if (saved < 0) {
      errors.savedAmount = "Saved amount cannot be negative.";
    }
  }

  const target = parseAmount(values.targetAmount);
  if (target === null) {
    errors.targetAmount = "Enter a valid target amount.";
  } else if (target <= 0) {
    errors.targetAmount = "Target must be greater than zero.";
  }

  const targetDate = values.targetDate.trim();
  if (targetDate.length > 0 && !isRealDate(targetDate)) {
    errors.targetDate = "Target date must be a valid YYYY-MM-DD date.";
  }

  if (!isValidCategoryColor(values.color)) {
    errors.color = "Choose a valid colour.";
  }

  return errors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSavingsGoal(value: unknown): value is SavingsGoal {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id.length === 0) return false;
  if (
    value.targetDate !== undefined &&
    value.targetDate !== null &&
    typeof value.targetDate !== "string"
  ) {
    return false;
  }
  if (value.color !== undefined && typeof value.color !== "string") {
    return false;
  }

  const input: NewSavingsGoal = {
    name: value.name as string,
    savedAmount: value.savedAmount as number,
    targetAmount: value.targetAmount as number,
    targetDate: value.targetDate as string | null | undefined,
    color: value.color as string | undefined,
  };

  return Object.keys(validateGoalInput(input)).length === 0;
}

export function sanitizeSavingsGoals(value: unknown): SavingsGoal[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.filter((goal): goal is SavingsGoal => {
    if (!isSavingsGoal(goal) || seen.has(goal.id)) return false;
    seen.add(goal.id);
    return true;
  });
}

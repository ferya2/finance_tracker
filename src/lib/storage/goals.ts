import { sanitizeSavingsGoals } from "@/lib/finance/goal-form";
import type { SavingsGoal } from "@/types/goal";

export const SAVINGS_GOALS_STORAGE_PREFIX = "finance-tracker:savings-goals";

export const SAVINGS_GOALS_CHANGE_EVENT = "finance-tracker:savings-goals-change";

export interface SavingsGoalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): SavingsGoalStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function savingsGoalsStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${SAVINGS_GOALS_STORAGE_PREFIX}:${
    id.length > 0 ? id : "anonymous"
  }`;
}

export function parseSavingsGoals(
  raw: string | null | undefined,
): SavingsGoal[] {
  if (!raw) return [];

  try {
    return sanitizeSavingsGoals(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function loadSavingsGoals(
  userId?: string | null,
  storage: SavingsGoalStorage | null = browserStorage(),
): SavingsGoal[] {
  if (!storage) return [];

  try {
    return parseSavingsGoals(storage.getItem(savingsGoalsStorageKey(userId)));
  } catch {
    return [];
  }
}

export function saveSavingsGoals(
  userId: string | null | undefined,
  goals: readonly SavingsGoal[],
  storage: SavingsGoalStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(
      savingsGoalsStorageKey(userId),
      JSON.stringify(sanitizeSavingsGoals(goals)),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SAVINGS_GOALS_CHANGE_EVENT));
    }
  } catch {
    return;
  }
}

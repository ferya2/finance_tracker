/** Just the row counts needed to decide whether an account is brand new. */
export interface OnboardingData {
  transactions: readonly unknown[];
  categories: readonly unknown[];
  budgets: readonly unknown[];
}

export const ONBOARDING_STEP_IDS = ["welcome", "categories", "ready"] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEP_IDS.length;

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  return Math.min(Math.max(Math.floor(step), 0), ONBOARDING_STEP_COUNT - 1);
}

/** True only when the account has no data at all yet. */
export function isFirstRun(data: OnboardingData | null | undefined): boolean {
  if (!data) return false;
  return (
    data.transactions.length === 0 &&
    data.categories.length === 0 &&
    data.budgets.length === 0
  );
}

/** Advance one step, stopping at the last one. */
export function nextOnboardingStep(step: number): number {
  return Math.min(clampStep(step) + 1, ONBOARDING_STEP_COUNT - 1);
}

/** Go back one step, stopping at the first one. */
export function previousOnboardingStep(step: number): number {
  return Math.max(clampStep(step) - 1, 0);
}

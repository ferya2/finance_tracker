/** The fields a savings goal needs to compute its progress, in integer cents. */
export interface GoalProgressInput {
  savedAmount: number;
  targetAmount: number;
}

/** How far one savings goal has come, in integer cents. */
export interface GoalProgress {
  /** Money saved toward the goal, in integer cents. */
  saved: number;
  /** Money needed to complete the goal, in integer cents. */
  target: number;
  /** Money still needed; never below zero once the goal is reached. */
  remaining: number;
  /** Saved as a share of the target, 0-100, capped when over-saved. */
  percent: number;
  /** True once the saved amount reaches a positive target. */
  completed: boolean;
}

/** Several savings goals rolled up into one headline, in integer cents. */
export interface GoalTotals {
  /** Every goal's saved amount added together. */
  saved: number;
  /** Every goal's target added together. */
  target: number;
  /** Money still needed across all goals; never below zero. */
  remaining: number;
  /** Saved as a share of the summed targets, 0-100, capped at 100. */
  percent: number;
  /** How many goals are being tracked. */
  tracked: number;
  /** How many of them have reached their target. */
  completedCount: number;
}

function toCents(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value);
}

/**
 * Compute how far a savings goal has come. A goal is complete once the saved
 * amount reaches a positive target; over-saving is capped at 100 percent and
 * never leaves a negative remainder. Amounts are integer cents.
 */
export function goalProgress(goal: GoalProgressInput): GoalProgress {
  const saved = toCents(goal.savedAmount);
  const target = toCents(goal.targetAmount);
  const completed = target > 0 && saved >= target;

  return {
    saved,
    target,
    remaining: Math.max(0, target - saved),
    percent:
      target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    completed,
  };
}

/**
 * Roll many savings goals into a single headline: the total saved against the
 * total target, how much is left, and how many goals are complete. An empty
 * list totals to zero rather than NaN.
 */
export function summarizeGoals(
  goals: readonly GoalProgressInput[],
): GoalTotals {
  let saved = 0;
  let target = 0;
  let remaining = 0;
  let completedCount = 0;

  for (const goal of goals) {
    const progress = goalProgress(goal);
    saved += progress.saved;
    target += progress.target;
    remaining += progress.remaining;
    if (progress.completed) completedCount += 1;
  }

  return {
    saved,
    target,
    remaining,
    percent:
      target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    tracked: goals.length,
    completedCount,
  };
}

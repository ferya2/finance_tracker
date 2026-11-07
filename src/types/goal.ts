/**
 * A savings goal the user is putting money aside for. All amounts are integer
 * cents so the progress maths stays exact.
 */
export interface SavingsGoal {
  id: string;
  name: string;
  /** Money already saved toward the goal, in integer cents. */
  savedAmount: number;
  /** The amount needed to complete the goal, in integer cents. */
  targetAmount: number;
  /** Optional deadline as an ISO `YYYY-MM-DD` string. */
  targetDate?: string | null;
  /** Hex accent colour used for the goal. */
  color?: string;
}

/** Shape accepted when creating a savings goal (`id` is assigned by the database). */
export type NewSavingsGoal = Omit<SavingsGoal, "id">;

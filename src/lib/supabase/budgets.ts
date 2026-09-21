import type { PostgrestError } from "@supabase/supabase-js";
import type { Budget, NewBudget } from "@/types/budget";
import { getSupabaseClient } from "./client";

/** A `budgets` row exactly as the database returns it (snake_case). */
interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

/** Row shape accepted when inserting a budget (`id` is assigned by the DB). */
interface NewBudgetRow {
  category_id: string;
  month: string;
  limit_amount: number;
}

/** Shape accepted when updating a budget — any subset of its fields. */
export type BudgetUpdate = Partial<NewBudget>;

export interface BudgetsResult {
  data: Budget[] | null;
  error: PostgrestError | null;
}

export interface CreateBudgetResult {
  data: Budget | null;
  error: PostgrestError | null;
}

export interface UpdateBudgetResult {
  data: Budget | null;
  error: PostgrestError | null;
}

export interface DeleteBudgetResult {
  error: PostgrestError | null;
}

function rowToBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    limitAmount: row.limit_amount,
  };
}

function budgetToRow(input: NewBudget): NewBudgetRow {
  return {
    category_id: input.categoryId,
    month: input.month,
    limit_amount: input.limitAmount,
  };
}

/** Read all of the current user's budgets, most recent month first. */
export async function listBudgets(): Promise<BudgetsResult> {
  const { data, error } = await getSupabaseClient()
    .from("budgets")
    .select("*")
    .order("month", { ascending: false });

  return {
    data: data ? data.map(rowToBudget) : null,
    error,
  };
}

/** Create a budget for the current user and return the saved row. */
export async function createBudget(
  input: NewBudget,
): Promise<CreateBudgetResult> {
  const { data, error } = await getSupabaseClient()
    .from("budgets")
    .insert([budgetToRow(input)])
    .select()
    .single();

  return {
    data: data ? rowToBudget(data as BudgetRow) : null,
    error,
  };
}

/** Map a partial app-level update to the snake_case row fields being changed. */
function budgetUpdateToRow(input: BudgetUpdate): Partial<BudgetRow> {
  const row: Partial<BudgetRow> = {};
  if (input.categoryId !== undefined) {
    row.category_id = input.categoryId;
  }
  if (input.month !== undefined) {
    row.month = input.month;
  }
  if (input.limitAmount !== undefined) {
    row.limit_amount = input.limitAmount;
  }
  return row;
}

/** Update fields of a single budget by id and return the saved row. */
export async function updateBudget(
  id: string,
  input: BudgetUpdate,
): Promise<UpdateBudgetResult> {
  const { data, error } = await getSupabaseClient()
    .from("budgets")
    .update(budgetUpdateToRow(input))
    .eq("id", id)
    .select()
    .single();

  return {
    data: data ? rowToBudget(data as BudgetRow) : null,
    error,
  };
}

/** Delete a single budget by id. */
export async function deleteBudget(
  id: string,
): Promise<DeleteBudgetResult> {
  const { error } = await getSupabaseClient()
    .from("budgets")
    .delete()
    .eq("id", id);

  return { error };
}
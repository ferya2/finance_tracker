import type { PostgrestError } from "@supabase/supabase-js";
import type { NewTransaction, Transaction } from "@/types/transaction";
import { getSupabaseClient } from "./client";

/** A `transactions` row exactly as the database returns it (snake_case). */
interface TransactionRow {
  id: string;
  amount: number;
  type: Transaction["type"];
  category_id: string;
  note: string | null;
  occurred_on: string;
}

/** Row shape accepted when inserting a transaction (`id` is assigned by the DB). */
interface NewTransactionRow {
  amount: number;
  type: Transaction["type"];
  category_id: string;
  note?: string;
  occurred_on: string;
}

export interface TransactionsResult {
  data: Transaction[] | null;
  error: PostgrestError | null;
}

export interface CreateTransactionResult {
  data: Transaction | null;
  error: PostgrestError | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    categoryId: row.category_id,
    note: row.note ?? undefined,
    occurredOn: row.occurred_on,
  };
}

function transactionToRow(input: NewTransaction): NewTransactionRow {
  const row: NewTransactionRow = {
    amount: input.amount,
    type: input.type,
    category_id: input.categoryId,
    occurred_on: input.occurredOn,
  };
  if (input.note !== undefined) {
    row.note = input.note;
  }
  return row;
}

/** Read all of the current user's transactions, newest first. */
export async function listTransactions(): Promise<TransactionsResult> {
  const { data, error } = await getSupabaseClient()
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false });

  return {
    data: data ? data.map(rowToTransaction) : null,
    error,
  };
}

/** Create a transaction for the current user and return the saved row. */
export async function createTransaction(
  input: NewTransaction,
): Promise<CreateTransactionResult> {
  const { data, error } = await getSupabaseClient()
    .from("transactions")
    .insert([transactionToRow(input)])
    .select()
    .single();

  return {
    data: data ? rowToTransaction(data as TransactionRow) : null,
    error,
  };
}
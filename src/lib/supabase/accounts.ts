import type { PostgrestError } from "@supabase/supabase-js";
import type { Account, NewAccount } from "@/types/account";
import { getSupabaseClient } from "./client";

/** The fields of an `accounts` row as the database stores them (snake_case). */
interface AccountRow {
  id: string;
  name: string;
  kind: Account["kind"];
  opening_balance: number;
  color: string;
}

/** Row shape accepted when inserting an account (`id` is assigned by the DB). */
interface NewAccountRow {
  name: string;
  kind: Account["kind"];
  opening_balance: number;
  color: string;
}

/** Shape accepted when updating an account — any subset of its fields. */
export type AccountUpdate = Partial<NewAccount>;

export interface AccountsResult {
  data: Account[] | null;
  error: PostgrestError | null;
}

export interface CreateAccountResult {
  data: Account | null;
  error: PostgrestError | null;
}

export interface UpdateAccountResult {
  data: Account | null;
  error: PostgrestError | null;
}

export interface DeleteAccountResult {
  error: PostgrestError | null;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    openingBalance: row.opening_balance,
    color: row.color,
  };
}

function accountToRow(input: NewAccount): NewAccountRow {
  return {
    name: input.name,
    kind: input.kind,
    opening_balance: input.openingBalance,
    color: input.color,
  };
}

/** Read all of the current user's accounts, in alphabetical name order. */
export async function listAccounts(): Promise<AccountsResult> {
  const { data, error } = await getSupabaseClient()
    .from("accounts")
    .select("*")
    .order("name", { ascending: true });

  return {
    data: data ? data.map(rowToAccount) : null,
    error,
  };
}

/** Create an account for the current user and return the saved row. */
export async function createAccount(
  input: NewAccount,
): Promise<CreateAccountResult> {
  const { data, error } = await getSupabaseClient()
    .from("accounts")
    .insert([accountToRow(input)])
    .select()
    .single();

  return {
    data: data ? rowToAccount(data as AccountRow) : null,
    error,
  };
}

/** Map a partial app-level update to the snake_case row fields being changed. */
function accountUpdateToRow(input: AccountUpdate): Partial<AccountRow> {
  const row: Partial<AccountRow> = {};
  if (input.name !== undefined) {
    row.name = input.name;
  }
  if (input.kind !== undefined) {
    row.kind = input.kind;
  }
  if (input.openingBalance !== undefined) {
    row.opening_balance = input.openingBalance;
  }
  if (input.color !== undefined) {
    row.color = input.color;
  }
  return row;
}

/** Update fields of a single account by id and return the saved row. */
export async function updateAccount(
  id: string,
  input: AccountUpdate,
): Promise<UpdateAccountResult> {
  const { data, error } = await getSupabaseClient()
    .from("accounts")
    .update(accountUpdateToRow(input))
    .eq("id", id)
    .select()
    .single();

  return {
    data: data ? rowToAccount(data as AccountRow) : null,
    error,
  };
}

/** Delete a single account by id. */
export async function deleteAccount(
  id: string,
): Promise<DeleteAccountResult> {
  const { error } = await getSupabaseClient()
    .from("accounts")
    .delete()
    .eq("id", id);

  return { error };
}

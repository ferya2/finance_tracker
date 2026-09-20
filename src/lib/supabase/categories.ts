import type { PostgrestError } from "@supabase/supabase-js";
import type { Category, NewCategory } from "@/types/category";
import { getSupabaseClient } from "./client";

/** Shape accepted when updating a category — any subset of its fields. */
export type CategoryUpdate = Partial<NewCategory>;

export interface CategoriesResult {
  data: Category[] | null;
  error: PostgrestError | null;
}

export interface CreateCategoryResult {
  data: Category | null;
  error: PostgrestError | null;
}

export interface UpdateCategoryResult {
  data: Category | null;
  error: PostgrestError | null;
}

export interface DeleteCategoryResult {
  error: PostgrestError | null;
}

/** Read all of the current user's categories, in alphabetical name order. */
export async function listCategories(): Promise<CategoriesResult> {
  const { data, error } = await getSupabaseClient()
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return {
    data: data ? (data as Category[]) : null,
    error,
  };
}

/** Create a category for the current user and return the saved row. */
export async function createCategory(
  input: NewCategory,
): Promise<CreateCategoryResult> {
  const { data, error } = await getSupabaseClient()
    .from("categories")
    .insert([input])
    .select()
    .single();

  return {
    data: data ? (data as Category) : null,
    error,
  };
}

/** Update fields of a single category by id and return the saved row. */
export async function updateCategory(
  id: string,
  input: CategoryUpdate,
): Promise<UpdateCategoryResult> {
  const { data, error } = await getSupabaseClient()
    .from("categories")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  return {
    data: data ? (data as Category) : null,
    error,
  };
}

/** Delete a single category by id. */
export async function deleteCategory(
  id: string,
): Promise<DeleteCategoryResult> {
  const { error } = await getSupabaseClient()
    .from("categories")
    .delete()
    .eq("id", id);

  return { error };
}
import type { PostgrestError } from "@supabase/supabase-js";
import type { NewTag, Tag } from "@/types/tag";
import { getSupabaseClient } from "./client";

/** The fields of a `tags` row as the database stores them (snake_case). */
interface TagRow {
  id: string;
  name: string;
  color: string;
}

/** Row shape accepted when inserting a tag (`id` is assigned by the DB). */
interface NewTagRow {
  name: string;
  color: string;
}

/** Shape accepted when updating a tag — any subset of its fields. */
export type TagUpdate = Partial<NewTag>;

export interface TagsResult {
  data: Tag[] | null;
  error: PostgrestError | null;
}

export interface CreateTagResult {
  data: Tag | null;
  error: PostgrestError | null;
}

export interface UpdateTagResult {
  data: Tag | null;
  error: PostgrestError | null;
}

export interface DeleteTagResult {
  error: PostgrestError | null;
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function tagToRow(input: NewTag): NewTagRow {
  return {
    name: input.name,
    color: input.color,
  };
}

/** Read all of the current user's tags, in alphabetical name order. */
export async function listTags(): Promise<TagsResult> {
  const { data, error } = await getSupabaseClient()
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  return {
    data: data ? data.map(rowToTag) : null,
    error,
  };
}

/** Create a tag for the current user and return the saved row. */
export async function createTag(input: NewTag): Promise<CreateTagResult> {
  const { data, error } = await getSupabaseClient()
    .from("tags")
    .insert([tagToRow(input)])
    .select()
    .single();

  return {
    data: data ? rowToTag(data as TagRow) : null,
    error,
  };
}

/** Map a partial app-level update to the snake_case row fields being changed. */
function tagUpdateToRow(input: TagUpdate): Partial<TagRow> {
  const row: Partial<TagRow> = {};
  if (input.name !== undefined) {
    row.name = input.name;
  }
  if (input.color !== undefined) {
    row.color = input.color;
  }
  return row;
}

/** Update fields of a single tag by id and return the saved row. */
export async function updateTag(
  id: string,
  input: TagUpdate,
): Promise<UpdateTagResult> {
  const { data, error } = await getSupabaseClient()
    .from("tags")
    .update(tagUpdateToRow(input))
    .eq("id", id)
    .select()
    .single();

  return {
    data: data ? rowToTag(data as TagRow) : null,
    error,
  };
}

/** Delete a single tag by id. */
export async function deleteTag(id: string): Promise<DeleteTagResult> {
  const { error } = await getSupabaseClient().from("tags").delete().eq("id", id);

  return { error };
}

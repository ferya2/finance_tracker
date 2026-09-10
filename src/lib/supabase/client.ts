import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export interface Credentials {
  email: string;
  password: string;
}

export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example).",
    );
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export async function signUp({ email, password }: Credentials) {
  return getSupabaseClient().auth.signUp({ email, password });
}

export async function signInWithPassword({ email, password }: Credentials) {
  return getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });
}

export async function signOut() {
  return getSupabaseClient().auth.signOut();
}
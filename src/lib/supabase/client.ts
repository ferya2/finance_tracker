import { createBrowserClient } from "@supabase/ssr";
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from "@supabase/supabase-js";

export type { SupabaseClient };

export interface Credentials {
  email: string;
  password: string;
}

// Cookie-based browser client (from @supabase/ssr) so the auth session is stored
// in cookies the Next.js proxy (middleware) can read. With the plain
// supabase-js client the session lives only in localStorage, the proxy sees no
// user, and a signed-in visitor gets bounced from /dashboard back to /login.
export function createSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
): SupabaseClient {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example).",
    );
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
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

export async function resetPassword(email: string) {
  return getSupabaseClient().auth.resetPasswordForEmail(email);
}

export async function signOut() {
  return getSupabaseClient().auth.signOut();
}

export async function getSession() {
  return getSupabaseClient().auth.getSession();
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return getSupabaseClient().auth.onAuthStateChange(callback);
}
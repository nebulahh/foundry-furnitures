import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseConfig } from "@/lib/env";

export function getBrowserSupabase() {
  if (!hasSupabaseConfig()) return null;
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}

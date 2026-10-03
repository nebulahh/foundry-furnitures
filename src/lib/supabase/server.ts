import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseAdmin } from "@/lib/env";

/** Server-only client using the secret/service role key. Never import from client code. */
export function getServiceSupabase() {
  if (!hasSupabaseAdmin()) return null;
  return createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, hasSupabaseConfig } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const origin = new URL(request.url).origin;

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/?auth=unconfigured", origin));
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.supabaseUrl!,
      env.supabaseAnonKey!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            for (const c of cookiesToSet) {
              cookieStore.set(c.name, c.value, c.options);
            }
          },
        },
      },
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, origin));
}

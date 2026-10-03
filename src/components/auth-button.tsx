"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null),
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) {
    return (
      <span
        className="text-xs text-moss"
        title="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in"
      >
        Sign-in unavailable
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="max-w-[10rem] truncate text-sm text-moss">
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-xs uppercase tracking-wider text-forest hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      }
      className="border border-forest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-forest hover:text-chalk"
    >
      Sign in with Google
    </button>
  );
}

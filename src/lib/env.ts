export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
  mailgunApiKey: process.env.MAILGUN_API_KEY,
  mailgunDomain: process.env.MAILGUN_DOMAIN,
  mailgunFrom: process.env.MAILGUN_FROM_EMAIL ?? process.env.MAILGUN_FROM,
  mailgunApiBase:
    process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export function hasSupabaseConfig(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseAdmin(): boolean {
  return Boolean(hasSupabaseConfig() && env.supabaseServiceKey);
}

export function hasMailgunConfig(): boolean {
  return Boolean(env.mailgunApiKey && env.mailgunDomain && env.mailgunFrom);
}

export const siteUrl = env.siteUrl;

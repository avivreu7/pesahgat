import { createClient } from '@supabase/supabase-js'

/**
 * Server-only admin client — uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * NEVER expose this client to the browser.
 * Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
            ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Creates a public storage bucket if it doesn't already exist.
 * Safe to call before every upload — silently ignores "already exists" errors.
 */
export async function ensureBucket(
  supabase: ReturnType<typeof createAdminClient>,
  name: string,
) {
  await supabase.storage.createBucket(name, { public: true })
  // Ignores error — if bucket already exists that's fine
}

// Integration tests (RUN_INTEGRATION=1) need real credentials — Next.js
// normally loads .env.local automatically, but vitest doesn't, so load it
// explicitly here before anything else runs.
if (process.env.RUN_INTEGRATION) {
  const { config } = await import('dotenv')
  config({ path: '.env.local' })
}

// Unit tests import pure functions from modules that also happen to
// construct a Supabase client at import time (src/lib/supabase-admin.ts).
// Placeholder values here just satisfy that constructor for tests that
// never actually issue a Supabase call — real credentials come from
// .env.local (loaded above) for integration tests.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://placeholder.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'placeholder-service-role-key'

export {}

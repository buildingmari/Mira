/**
 * Centralized Supabase client
 * ─────────────────────────────────────────────────────────────────────
 * Credentials are read from environment variables so they are never
 * hardcoded in source files or visible in plain-text HTML.
 *
 * For local development:
 *   1. Copy .env.example → .env.local
 *   2. Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 *
 * For production (Vercel / Netlify / etc.):
 *   Set the same two env vars in your hosting platform's dashboard.
 *
 * NOTE: The anon key is intentionally public-safe — it is designed
 * to be shipped to browsers. Real data security is enforced by
 * Supabase Row Level Security (RLS) policies on the database.
 * ─────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    '[supabase] Missing env vars.\n' +
    'Copy .env.example → .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon);

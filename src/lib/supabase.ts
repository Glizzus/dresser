// The ONLY place outside the repo layer that names the Supabase client.
// (Re-exported through the repo; components/hooks never import this.)

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigured = Boolean(url && anonKey)

if (!supabaseConfigured) {
  // Surfaced in the UI as a setup notice rather than a hard crash, so the
  // app still boots for first-time setup. Writes need connectivity (known
  // v1 limitation, stated in the README).
  console.warn(
    '[Dresser] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — see README.',
  )
}

export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-not-set',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Defensive check — if these are undefined, Supabase will throw
// "Invalid path specified in request URL" or "TypeError: Invalid URL"
// This happens when Vercel environment variables are NOT configured in the project dashboard.
if (!supabaseUrl || !supabaseAnonKey) {
  const msg = `
[CRAFT SMS] CRITICAL: Supabase environment variables are missing.
  NEXT_PUBLIC_SUPABASE_URL  = ${supabaseUrl ? 'SET' : 'MISSING ❌'}
  NEXT_PUBLIC_SUPABASE_ANON_KEY = ${supabaseAnonKey ? 'SET' : 'MISSING ❌'}

You must add these to your Vercel project's Environment Variables dashboard.
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
`
  console.error(msg)
  // In browser, show a visible indicator
  if (typeof window !== 'undefined') {
    document.title = '⚠️ Config Error — CRAFT SMS'
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

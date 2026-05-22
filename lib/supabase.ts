import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a stub during build/SSG when env vars are not set
    // This prevents build failures; real usage requires env vars at runtime
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Singleton for client-side use
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}

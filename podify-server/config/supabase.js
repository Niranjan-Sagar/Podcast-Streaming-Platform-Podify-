import { createClient } from '@supabase/supabase-js'

// Lazily created on first use, not at import time — same reasoning as the
// Razorpay client: ES module imports execute before dotenv.config() runs,
// so process.env values aren't populated yet if we create the client here directly.
let supabaseInstance = null

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  }
  return supabaseInstance
}

export const BUCKET_NAME = 'podify-media'
import { createClient } from '@supabase/supabase-js'

const url = (import.meta as any).env.VITE_SUPABASE_URL as string
const anon = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string
if (!url || !anon) throw new Error('Missing Supabase env vars')

export const supabase = createClient(url, anon)

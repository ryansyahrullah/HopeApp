import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[HopeApp] Supabase credentials belum dikonfigurasi.\n' +
    'Copy .env.example ke .env dan isi dengan credentials dari Supabase Dashboard.'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://warwewbeirhmqhbpdxoj.supabase.co'
const supabaseKey = 'sb_publishable_vCPsobBANikaTMc8wF-sKA_s81YP8yi'

        
export const supabase = createClient(supabaseUrl, supabaseKey)
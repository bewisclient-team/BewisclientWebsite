import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = 'https://dhgqwcqjskiulbatvjty.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_KEY')
export const supabase = createClient(supabaseUrl, supabaseKey!)
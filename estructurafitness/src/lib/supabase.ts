// app.supabase.com → Crear proyecto
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('TU_URL', 'TU_ANON_KEY')

// Login real
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: '123456'
})

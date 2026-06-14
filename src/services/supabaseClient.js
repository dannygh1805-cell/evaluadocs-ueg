import { createClient } from '@supabase/supabase-js';

// Usar variables de entorno de Vite
// El usuario deberá proveer estas variables en un archivo .env local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'tu-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

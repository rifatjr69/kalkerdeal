// @ts-ignore
import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' && process.env ? process.env : {} as any);

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://lftkirwycapbwmtlyndw.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmdGtpcnd5Y2FwYndtdGx5bmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTA3NDEsImV4cCI6MjEwODA4Njc0MX0.aTh_jQ8kj2Yx0xlxikyKpi6cs8BhFGofKW4_3qaItac';

let client: any = null;

try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
} catch (err) {
  console.error('Supabase initialization error, using fallback:', err);
  client = {
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase offline' } }),
      signUp: async () => ({ error: { message: 'Supabase offline' } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }), order: async () => ({ data: [], error: null }) }),
        or: () => ({ order: async () => ({ data: [], error: null }) }),
        order: async () => ({ data: [], error: null })
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null })
    })
  };
}

export const supabase = client;

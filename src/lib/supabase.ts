import { createClient } from '@supabase/supabase-js';

// Fallback to process.env for Node environments or import.meta.env for Vite client environments
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || process.env[key.replace('VITE_', '')] || '';
  }
  try {
    return (import.meta as any).env?.[key] || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => ({
              single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
            })
          })
        }),
        upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      })
    } as any;

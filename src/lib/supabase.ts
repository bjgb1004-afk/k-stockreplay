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

// Chainable no-op stand-in for when Supabase isn't configured (local dev, or
// this sandbox with no live credentials). Query builders like .select().eq()
// or .upsert(...) can be chained any number of ways and in any order - a
// fixed-shape mock only covers whichever one chain it was written for and
// throws "not a function" on every other caller (bit fetch-facts.mjs before:
// push.ts's .insert() and votes.ts's .select().eq() would each need their own
// hardcoded shape). A Proxy that returns itself for any property access, and
// resolves to { data: null, error } when awaited, covers every shape at once.
function createUnconfiguredClient() {
  const error = new Error('Supabase not configured');
  const chainable: any = new Proxy(() => {}, {
    get: (_target, prop) => (prop === 'then' ? (resolve: any) => resolve({ data: null, error }) : () => chainable),
    apply: () => chainable,
  });
  return { from: () => chainable } as any;
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createUnconfiguredClient();

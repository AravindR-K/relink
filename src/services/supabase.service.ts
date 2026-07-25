import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let mockInstance: SupabaseClient | null = null;

function createMockClient(): SupabaseClient {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }), maybeSingle: () => Promise.resolve({ data: null, error: null }), limit: () => ({ order: () => Promise.resolve({ data: [], error: null }) }), in: () => Promise.resolve({ data: [], error: null }), gte: () => ({ lte: () => ({ ilike: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }) }) }), select: (...args: unknown[]) => Promise.resolve({ data: args, error: null }), insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured — use mock data') }) }) }), update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }), }),
    }),
  } as unknown as SupabaseClient;
}

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project.supabase.co') {
    console.warn('[Supabase] Not configured — using mock client. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for full functionality.');
    if (!mockInstance) mockInstance = createMockClient();
    return mockInstance;
  }

  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });

  return supabaseInstance;
}

export function getSupabaseAnonClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url === 'https://your-project.supabase.co') {
    console.warn('[Supabase] Anon client not configured — using mock.');
    if (!mockInstance) mockInstance = createMockClient();
    return mockInstance;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

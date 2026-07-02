import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Single anon client with session — all admin queries use RLS policies that check is_admin()
export const authSupabase = createClient(supabaseUrl, anonKey);

// Alias kept for compatibility; same client instance
export const adminSupabase = authSupabase;

/** Fetch a user_id → display_name map for a list of user IDs. */
export async function fetchDisplayNames(userIds: string[]): Promise<Record<string, string | null>> {
  if (userIds.length === 0) return {};
  const { data } = await authSupabase
    .from('user_profiles')
    .select('user_id, display_name')
    .in('user_id', userIds);
  const map: Record<string, string | null> = {};
  (data ?? []).forEach((r: any) => { map[r.user_id] = r.display_name ?? null; });
  return map;
}

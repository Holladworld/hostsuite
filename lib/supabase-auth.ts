import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  return token ? token : null;
}

export async function getVerifiedUser(request: Request): Promise<{
  user: User;
  client: SupabaseClient;
} | null> {
  const accessToken = extractBearerToken(request);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!accessToken || !supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user) return null;

  return { user: data.user, client };
}

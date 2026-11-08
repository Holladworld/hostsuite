import { createClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ADMIN_EMAIL } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: cookieStore.toString(),
      },
    },
  });
}

/**
 * Verify an admin request using the bearer access token issued by Supabase Auth.
 * The token is verified by Supabase Auth; do not authorize from a decoded JWT,
 * browser-supplied email, or a cookie-backed getSession() call.
 */
export async function getVerifiedAdmin(request: Request): Promise<User | null> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const accessToken = match?.[1]?.trim();

  if (!accessToken || !supabaseUrl || !supabaseAnonKey) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: { user }, error } = await client.auth.getUser(accessToken);
  if (error || !user?.email) return null;

  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? user : null;
}

export async function verifyAdmin(request: Request): Promise<boolean> {
  return Boolean(await getVerifiedAdmin(request));
}

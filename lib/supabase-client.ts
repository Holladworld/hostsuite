'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

// Defer client creation until an actual browser-side operation needs it.
// This keeps static prerendering independent of deployment secrets while still
// failing clearly at runtime if the public Supabase configuration is missing.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export type AuthUser = {
  id: string;
  email: string;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const client = getSupabaseClient();

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(
        data.session?.user
          ? { id: data.session.user.id, email: data.session.user.email ?? '' }
          : null
      );
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(
        sess?.user
          ? { id: sess.user.id, email: sess.user.email ?? '' }
          : null
      );
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await getSupabaseClient().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  return { session, user, loading, signIn, signUp, signOut };
}

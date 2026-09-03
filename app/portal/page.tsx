'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Server, Lock, Mail, Loader2, UserPlus, ArrowRight, ShieldCheck, MessageCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, useAuth } from '@/lib/supabase-client';
import { BRAND, waLink } from '@/lib/constants';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PortalLoginInner />
    </Suspense>
  );
}

function PortalLoginInner() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      toast.error('Unauthorized access. Admin only.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/portal/dashboard');
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back to your HostSuite portal.');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Account created. Welcome to HostSuite.');
      }
      setAuthenticating(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading || authenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Securing your session…</p>
        </div>
      </div>
    );
  }

  if (!loading && user) return null;

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Server className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight">HostSuite</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Portal</span>
          </div>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-2xl border border-border p-7 shadow-xl shadow-primary/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-center font-display text-2xl font-bold tracking-tight">
              {mode === 'signin' ? 'Client Sign In' : 'Create Your Portal Account'}
            </h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              {mode === 'signin'
                ? 'Access your hosted domains, SLA tier, and support tickets.'
                : 'Create an account to open your HostSuite client portal.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portal-email">Corporate Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="portal-email"
                    type="email"
                    placeholder="you@company.com.ng"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="portal-password">Password</Label>
                  {mode === 'signin' && (
                    <Link href="/portal/forgot-password" className="text-xs font-semibold text-primary underline-offset-4 hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="portal-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span> : <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create Account</span>}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-4 rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
              Secured by Supabase · Email &amp; password only
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" className="font-semibold text-primary underline-offset-4 hover:underline" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <a href={waLink('Hello HostSuite, I need help accessing my client portal.')} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <MessageCircle className="h-4 w-4" /> Need help? WhatsApp us
              </a>
            </Button>
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">A {BRAND.parent} product</p>
        </motion.div>
      </main>
    </div>
  );
}

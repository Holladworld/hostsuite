'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Server, Lock, Mail, Loader2, UserPlus, ArrowRight, ShieldCheck, MessageCircle, ArrowLeft, User, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, useAuth } from '@/lib/supabase-client';
import { BRAND, waLink } from '@/lib/constants';
import { toast } from 'sonner';

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
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(() => searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const requestedNext = searchParams.get('next');
  const nextPath = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/portal/dashboard';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      toast.error('Unauthorized access. Admin only.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, user, router, nextPath]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      toast.error('Use a password with at least 8 characters.');
      return;
    }
    if (mode === 'signup') {
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
        toast.error('Enter your first name, last name and phone number to create your account.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Your passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success('Welcome back to your HostSuite portal.');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`,
              phone: phone.trim(),
              company: company.trim() || null,
              marketing_opt_in: marketingOptIn,
              marketing_consent_at: marketingOptIn ? new Date().toISOString() : null,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success('Account details saved. Check your email to confirm your account, then sign in to continue.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
          return;
        }
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
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{mode === 'signup' ? 'Create account' : 'Sign in'}</span>
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
          className="w-full max-w-lg"
        >
          <div className="glass-strong rounded-2xl border border-border p-7 shadow-xl shadow-primary/5 sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {mode === 'signin' ? <Lock className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
            </div>
            <h1 className="text-center font-display text-2xl font-bold tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create your HostSuite account'}
            </h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              {mode === 'signin'
                ? 'Access your domains, websites, email and support.'
                : 'One account for your services, purchases and support.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portal-first-name">First name</Label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="portal-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="pl-9" autoComplete="given-name" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-last-name">Last name</Label>
                      <Input id="portal-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" autoComplete="family-name" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal-phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="portal-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="pl-9" autoComplete="tel" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal-company">Business or organisation <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="portal-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Business name" className="pl-9" autoComplete="organization" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="portal-email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="portal-email" type="email" placeholder="you@company.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="portal-password" type="password" placeholder="At least 8 characters" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required />
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="portal-confirm-password">Confirm password</Label>
                    <Input id="portal-confirm-password" type="password" placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm">
                    <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />
                    <span><span className="font-medium">Send me product updates and helpful emails</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">Optional. You can unsubscribe at any time. This does not affect service or billing messages.</span></span>
                  </label>
                </>
              )}

              <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin'
                  ? <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>
                  : <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create Account</span>}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-secondary" />
              Secured by Supabase authentication
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
              <a href={waLink('Hello HostSuite, I need help accessing my account.')} target="_blank" rel="noopener noreferrer" className="gap-1.5">
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

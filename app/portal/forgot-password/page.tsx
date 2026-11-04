'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail, Server, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/portal/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to send reset link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link href="/portal" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Client Portal
        </Link>

        <div className="glass-strong rounded-2xl border border-border p-7 shadow-xl shadow-primary/5">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Server className="h-7 w-7" />
          </div>
          <h1 className="text-center font-display text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter the email address on your HostSuite account and we&apos;ll send you a secure reset link.
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, a password reset link has been sent. Check your inbox and spam folder.
              </div>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/portal">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Account Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="reset-email" type="email" placeholder="you@company.com.ng" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Secure password recovery
          </div>
        </div>
      </div>
    </div>
  );
}

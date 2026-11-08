'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Server, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setReady(Boolean(data.session));
      if (!data.session) toast.error('This reset link is invalid or has expired.');
    });
    return () => { mounted = false; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Password updated successfully.');
      router.replace('/portal');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setBusy(false);
    }
  }

  const PasswordField = ({ id, label, value, onChange, visible, toggle }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; toggle: () => void }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} className="pl-9 pr-10" autoComplete="new-password" required />
        <button type="button" aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} onClick={toggle} className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );

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
          <h1 className="text-center font-display text-2xl font-bold tracking-tight">Create a new password</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">Choose a new password for your HostSuite client portal.</p>

          {!ready ? (
            <div className="mt-8 flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <PasswordField id="new-password" label="New Password" value={password} onChange={setPassword} visible={showPassword} toggle={() => setShowPassword((v) => !v)} />
              <PasswordField id="confirm-password" label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} toggle={() => setShowConfirm((v) => !v)} />
              <Button type="submit" disabled={busy} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </Button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" /> Your password is securely managed by Supabase
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/supabase-client';
import { formatNaira } from '@/lib/format';

type Plan = { id: string; name: string; interval: 'monthly' | 'yearly'; amount: number; currency: string };

export default function ManagedPlanCheckoutPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>}><ManagedPlanCheckout /></Suspense>;
}

function ManagedPlanCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const planKey = params.get('plan') ?? '';
  const interval = params.get('interval') ?? 'monthly';
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const next = `/portal/managed-plan?plan=${encodeURIComponent(planKey)}&interval=${encodeURIComponent(interval)}`;
      router.replace(`/portal?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!['starter_ops', 'managed_growth'].includes(planKey) || !['monthly', 'yearly'].includes(interval)) {
      setError('That plan selection is not valid. Please return to pricing and choose a plan again.');
      return;
    }
    let active = true;
    fetch(`/api/billing/managed-plans?plan=${encodeURIComponent(planKey)}&interval=${encodeURIComponent(interval)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? 'This plan is not available.');
        if (active) setPlan(result as Plan);
      })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'We could not load this plan.'); });
    return () => { active = false; };
  }, [loading, user, router, planKey, interval]);

  async function beginCheckout() {
    if (!session?.access_token) { setError('Your sign-in session has expired. Please sign in again.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/billing/managed-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ planKey, interval }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not start checkout.');
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not start checkout. Please try again.');
      setBusy(false);
    }
  }

  if (loading || !user || (!plan && !error)) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;

  return <main className="min-h-screen bg-[#F8F6F3] px-4 py-10 text-[#281936] sm:py-16">
    <div className="mx-auto max-w-3xl">
      <Link href="/#pricing" className="inline-flex items-center gap-2 text-sm text-[#71657B] hover:text-[#281936]"><ArrowLeft className="h-4 w-4" /> Back to pricing</Link>
      <div className="mt-8 border-b border-[#E5DCEC] pb-7">
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#93634D]">HostSuite managed care</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Review your plan.</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#71657B]">Confirm the care plan and billing period before continuing to secure payment.</p>
      </div>
      {error && <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {plan && <section className="mt-8 rounded-2xl border border-[#E5DCEC] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6D3AA0]">Selected plan</p><h2 className="mt-2 font-display text-3xl">{plan.name}</h2><p className="mt-1 text-sm text-[#71657B]">Prepaid {plan.interval === 'yearly' ? 'annual' : 'monthly'} care term</p></div>
          <div className="text-right"><p className="font-mono-data text-3xl font-semibold">{formatNaira(plan.amount)}</p><p className="mt-1 text-xs text-[#8A7E93]">for this {plan.interval === 'yearly' ? 'year' : 'month'}</p></div>
        </div>
        <div className="my-7 border-t border-[#EEE8F1]" />
        <div className="flex items-start gap-3 text-sm leading-6 text-[#71657B]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6D3AA0]" /><p>Your payment is processed securely by the configured payment provider. The amount is calculated on the server from HostSuite’s active plan price.</p></div>
        <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#71657B]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6D3AA0]" /><p>This is a prepaid service term. Automatic renewal is not enabled; you will need to renew manually before the term ends.</p></div>
        <Button onClick={beginCheckout} disabled={busy} className="mt-8 h-12 w-full rounded-none bg-[#281936] text-white hover:bg-[#5D2A86]">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting to payment…</> : <>Continue to secure payment <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
        <p className="mt-3 text-center text-xs text-[#8A7E93]">Signed in as {user.email}</p>
      </section>}
    </div>
  </main>;
}

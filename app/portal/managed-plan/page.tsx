'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/supabase-client';
import { formatNaira } from '@/lib/format';

type Plan = { id: string; name: string; interval: 'monthly' | 'yearly'; amount: number; currency: string; provider: 'paystack' | 'flutterwave' };

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
  const [autoRenew, setAutoRenew] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [recurringConsent, setRecurringConsent] = useState(false);

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
    if (!termsAccepted) { setError('Please accept the managed-care terms before continuing.'); return; }
    if (autoRenew && !recurringConsent) { setError('Please authorize recurring payments, or turn automatic renewal off.'); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/billing/managed-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ planKey, interval, autoRenew, termsAccepted, recurringConsent }),
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

  const period = plan?.interval === 'yearly' ? 'year' : 'month';
  return <main className="min-h-screen bg-[#F8F6F3] px-4 py-10 text-[#281936] sm:py-16">
    <div className="mx-auto max-w-3xl">
      <Link href="/#pricing" className="inline-flex items-center gap-2 text-sm text-[#71657B] hover:text-[#281936]"><ArrowLeft className="h-4 w-4" /> Back to pricing</Link>
      <div className="mt-8 border-b border-[#E5DCEC] pb-7">
        <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#93634D]">HostSuite managed care</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Review your plan.</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-[#71657B]">Your managed-care plan renews automatically unless you choose not to renew. Review the billing terms before authorizing payment.</p>
      </div>
      {error && <div role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {plan && <section className="mt-8 rounded-2xl border border-[#E5DCEC] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6D3AA0]">Selected plan</p><h2 className="mt-2 font-display text-3xl">{plan.name}</h2><p className="mt-1 text-sm text-[#71657B]">{autoRenew ? `Recurring ${period}ly managed care` : `One ${period} of managed care`}</p></div>
          <div className="text-right"><p className="font-mono-data text-3xl font-semibold">{formatNaira(plan.amount)}</p><p className="mt-1 text-xs text-[#8A7E93]">per {period}</p></div>
        </div>
        <div className="my-7 border-t border-[#EEE8F1]" />
        <div className="flex items-start gap-3 text-sm leading-6 text-[#71657B]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6D3AA0]" /><p>Payment is processed securely by {session ? 'HostSuite’s configured payment provider' : 'the payment provider'}. The amount is calculated on the server from HostSuite’s active plan price.</p></div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCCFE7] bg-[#FAF7FC] p-4">
          <input type="checkbox" checked={autoRenew} onChange={(event) => { setAutoRenew(event.target.checked); setRecurringConsent(false); }} className="mt-1 h-4 w-4 accent-[#6D3AA0]" />
          <span><span className="block text-sm font-semibold text-[#281936]">Keep my managed-care plan renewing automatically</span><span className="mt-1 block text-xs leading-5 text-[#71657B]">Selected by default. You will be charged {formatNaira(plan.amount)} every {period} until you cancel. You can switch this off at any time; cancellation will stop the next charge while your already-paid service period remains active.</span></span>
        </label>

        {autoRenew && <p className="mt-3 text-xs leading-5 text-[#71657B]">{plan.provider === 'flutterwave' ? 'Flutterwave recurring subscriptions require a card payment method.' : 'Paystack recurring subscriptions support cards and eligible Nigerian direct-debit authorizations.'}</p>}
        {autoRenew && <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#51445F]">
          <input type="checkbox" checked={recurringConsent} onChange={(event) => setRecurringConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#6D3AA0]" />
          <span>I authorize HostSuite and its payment provider to charge my selected payment method {formatNaira(plan.amount)} every {period} for this managed-care plan until I cancel. I understand the recurring amount and billing frequency, and that I can turn off renewal from my billing dashboard.</span>
        </label>}

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#51445F]">
          <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-[#6D3AA0]" />
          <span>I agree to HostSuite’s <Link href="/terms" className="font-semibold text-[#6D3AA0] underline underline-offset-2">Terms of Service</Link> and understand that the plan covers only the services and allowances described in the selected plan.</span>
        </label>

        {!autoRenew && <p className="mt-3 rounded-lg bg-[#F7F3EE] p-3 text-xs leading-5 text-[#71657B]">Automatic renewal is off. You will pay for this {period} only; HostSuite will not automatically charge you again. You can purchase another term later.</p>}

        <Button onClick={beginCheckout} disabled={busy || !termsAccepted || (autoRenew && !recurringConsent)} className="mt-8 h-12 w-full rounded-none bg-[#281936] text-white hover:bg-[#5D2A86]">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting to payment…</> : <>Continue to secure payment <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>
        <p className="mt-3 text-center text-xs text-[#8A7E93]">Signed in as {user.email}</p>
      </section>}
    </div>
  </main>;
}

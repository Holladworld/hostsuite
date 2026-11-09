'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/supabase-client';
import { formatNaira } from '@/lib/format';

type PaymentStatus = {
  status: string;
  amount: number;
  currency: string;
  planName: string;
  interval: string | null;
  subscription: {
    next_billing_at: string | null;
    current_period_end: string | null;
    auto_renew: boolean;
    cancel_at_period_end: boolean;
  } | null;
};

export default function ManagedPlanCompletePage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>}><ManagedPlanComplete /></Suspense>;
}

function ManagedPlanComplete() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, session, loading } = useAuth();
  const reference = params.get('reference') ?? params.get('tx_ref') ?? '';
  const [result, setResult] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!session?.access_token || !reference) return;
    setChecking(true); setError('');
    try {
      const response = await fetch(`/api/billing/managed-plans/status?reference=${encodeURIComponent(reference)}`, { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'We could not check the payment yet.');
      setResult(data as PaymentStatus);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not check the payment yet.'); }
    finally { setChecking(false); }
  }, [session?.access_token, reference]);

  useEffect(() => {
    if (!loading && !user) router.replace(`/portal?next=${encodeURIComponent('/portal/managed-plan/complete?reference=' + reference)}`);
  }, [loading, user, router, reference]);
  useEffect(() => { if (user && session?.access_token && reference) void checkStatus(); }, [user, session?.access_token, reference, checkStatus]);

  const paid = result?.status === 'paid';
  const failed = result?.status === 'failed' || result?.status === 'cancelled';
  const paidThrough = result?.subscription?.current_period_end ?? result?.subscription?.next_billing_at;
  return <main className="flex min-h-screen items-center justify-center bg-[#F8F6F3] px-4 py-10 text-[#281936]">
    <section className="w-full max-w-xl rounded-2xl border border-[#E5DCEC] bg-white p-7 text-center shadow-sm sm:p-10">
      {paid ? <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /> : failed ? <XCircle className="mx-auto h-12 w-12 text-red-600" /> : <Clock3 className="mx-auto h-12 w-12 text-[#93634D]" />}
      <p className="mt-5 font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#93634D]">HostSuite payment update</p>
      <h1 className="mt-3 font-display text-3xl">{paid ? 'Your care plan is active.' : failed ? 'Payment was not completed.' : 'We are confirming your payment.'}</h1>
      {paid && result && <><p className="mt-3 text-sm leading-7 text-[#71657B]">{result.planName} · {result.interval === 'yearly' ? 'Annual' : 'Monthly'} term · {formatNaira(result.amount)}</p><p className="mt-4 text-sm leading-6 text-[#71657B]">{result.subscription?.auto_renew ? 'Automatic renewal is active. Your selected payment method will be charged again at the end of each paid period until you cancel.' : 'Automatic renewal is off. This payment covers one service period only.'} You can manage renewal from your billing dashboard.</p>{paidThrough && <p className="mt-3 text-xs text-[#8A7E93]">Paid-through date: {new Date(paidThrough).toLocaleDateString()}</p>}</>}
      {!paid && !failed && <p className="mt-3 text-sm leading-7 text-[#71657B]">The payment provider has returned you to HostSuite. It can take a short time for the verified payment notification to arrive. Do not pay again while this check is pending.</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {!paid && !failed && <Button onClick={() => void checkStatus()} disabled={checking} variant="outline" className="mt-6">{checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Check payment status</Button>}
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="rounded-none bg-[#281936] text-white hover:bg-[#5D2A86]"><Link href="/portal/dashboard">Go to customer dashboard</Link></Button><Button asChild variant="outline" className="rounded-none"><Link href="/portal/billing">View billing</Link></Button></div>
      <p className="mt-5 break-all text-[11px] text-[#8A7E93]">Reference: {reference || 'Not supplied'}</p>
    </section>
  </main>;
}

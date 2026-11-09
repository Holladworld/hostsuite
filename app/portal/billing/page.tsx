'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, FileText, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/supabase-client';

type Order = { id: string; status: string; currency: string; total: number; provider: string | null; created_at: string; paid_at: string | null };
type Invoice = { id: string; invoice_number: string; status: string; currency: string; total: number; due_at: string | null; paid_at: string | null; created_at: string };
type Subscription = { id: string; service_name: string; amount: number; currency: string; interval: string; status: string; next_billing_at: string | null; current_period_end: string | null; auto_renew: boolean; cancel_at_period_end: boolean; provider: string | null };
type Summary = { provider: { provider: string; configured: boolean }; orders: Order[]; invoices: Invoice[]; subscriptions: Subscription[] };

const money = (currency: string, value: number) => `${currency} ${Number(value).toLocaleString()}`;
const statusTone = (status: string) => status === 'paid' || status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' : status === 'failed' || status === 'cancelled' ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400';

export default function BillingPage() {
  const { user, session } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');
      const response = await fetch('/api/billing/summary', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not load your billing information.');
      setSummary(result as Summary);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not load your billing information.'); }
    finally { setLoading(false); }
  }

  async function cancelRenewal(subscriptionId: string) {
    if (!window.confirm('Turn off automatic renewal? Your managed-care service will remain active until the end of the period you have already paid for.')) return;
    if (!session?.access_token) { setError('Your session has expired. Please sign in again.'); return; }
    setCancellingId(subscriptionId); setError(''); setNotice('');
    try {
      const response = await fetch('/api/billing/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ subscriptionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not turn off automatic renewal.');
      setNotice(result.message ?? 'Automatic renewal has been turned off.');
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not cancel automatic renewal.'); }
    finally { setCancellingId(null); }
  }

  async function updatePaymentMethod(subscriptionId: string) {
    if (!session?.access_token) { setError('Your session has expired. Please sign in again.'); return; }
    setManagingId(subscriptionId); setError('');
    try {
      const response = await fetch('/api/billing/subscriptions/manage-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ subscriptionId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not open the payment-method update page.');
      window.location.assign(result.url);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not open the payment-method update page.'); }
    finally { setManagingId(null); }
  }
  useEffect(() => { if (user && session?.access_token) void load(); }, [user, session?.access_token]);

  const invoices = summary?.invoices ?? [];
  const subscriptions = summary?.subscriptions ?? [];
  const orders = summary?.orders ?? [];
  const openInvoices = invoices.filter((invoice) => invoice.status === 'open').length;

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border"><div className="mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><div className="flex items-center gap-3"><span className="font-display text-lg font-bold tracking-tight">HostSuite</span><Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button></div></div></header>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div><p className="text-sm font-medium text-primary">Billing</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Payments & services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Your payment history, invoices, recurring services and renewal controls.</p></div>
      {error && <div role="alert" className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p className="font-semibold">We’re having trouble completing that action.</p><p className="mt-1 text-muted-foreground">{error}</p></div>}
      {notice && <div role="status" className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-800 dark:text-emerald-300">{notice}</div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><CardContent className="p-5"><Wallet className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Open invoices</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : openInvoices}</p></CardContent></Card><Card><CardContent className="p-5"><Receipt className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Active subscriptions</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : subscriptions.filter((item) => item.status === 'active').length}</p></CardContent></Card><Card><CardContent className="p-5"><CreditCard className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Payment gateway</p><p className="mt-1 text-xl font-semibold capitalize">{summary?.provider.provider ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">{summary?.provider.configured ? 'Ready' : 'Temporarily unavailable'}</p></CardContent></Card><Card><CardContent className="p-5"><FileText className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Invoices</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : invoices.length}</p></CardContent></Card></div>

      <Card className="mt-6"><CardHeader><CardTitle>Subscriptions</CardTitle><CardDescription>Recurring services, renewal dates and cancellation controls. Turning off renewal does not remove service you have already paid for.</CardDescription></CardHeader><CardContent>{subscriptions.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No recurring services are recorded for your account yet.</p> : <div className="space-y-2">{subscriptions.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div className="min-w-0"><p className="font-medium">{item.service_name}</p><p className="mt-1 text-sm text-muted-foreground">{money(item.currency, item.amount)} / {item.interval} · Auto-renew {item.auto_renew ? 'on' : 'off'}</p><p className="mt-1 text-xs text-muted-foreground">{item.cancel_at_period_end ? `Automatic renewal off · Service active through ${item.current_period_end ? new Date(item.current_period_end).toLocaleDateString() : 'the paid-through date'}` : item.auto_renew ? `Next charge: ${item.next_billing_at ? new Date(item.next_billing_at).toLocaleDateString() : 'provider scheduled'}` : `Paid term ends: ${item.current_period_end ? new Date(item.current_period_end).toLocaleDateString() : 'not recorded'}`}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className={statusTone(item.status)}>{item.status.replaceAll('_', ' ')}</Badge>{item.auto_renew && (item.status === 'active' || item.status === 'past_due') && <Button size="sm" variant="outline" onClick={() => void cancelRenewal(item.id)} disabled={cancellingId === item.id}>{cancellingId === item.id ? 'Cancelling…' : 'Turn off renewal'}</Button>}{item.provider === 'paystack' && item.status === 'past_due' && <Button size="sm" variant="outline" onClick={() => void updatePaymentMethod(item.id)} disabled={managingId === item.id}>{managingId === item.id ? 'Opening…' : 'Update payment method'}</Button>}</div></div>)}</div>}</CardContent></Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Payment history</CardTitle><CardDescription>Orders confirmed by HostSuite’s payment workflow.</CardDescription></CardHeader><CardContent>{orders.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No payments are recorded yet.</p> : <div className="space-y-2">{orders.map((order) => <div key={order.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{money(order.currency, Number(order.total))}</p><p className="mt-1 text-xs text-muted-foreground">{order.provider ?? 'Payment'} · {new Date(order.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className={statusTone(order.status)}>{order.status}</Badge></div>)}</div>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Invoices belonging to your HostSuite account.</CardDescription></CardHeader><CardContent>{invoices.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No invoices are recorded yet.</p> : <div className="space-y-2">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{invoice.invoice_number}</p><p className="mt-1 text-xs text-muted-foreground">{money(invoice.currency, Number(invoice.total))} · {new Date(invoice.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className={statusTone(invoice.status)}>{invoice.status}</Badge></div>)}</div>}</CardContent></Card></div>
    </main>
  </div>;
}

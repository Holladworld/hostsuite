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
type Subscription = { id: string; service_name: string; amount: number; currency: string; interval: string; status: string; next_billing_at: string | null; auto_renew: boolean };
type Summary = { provider: { provider: string; configured: boolean }; orders: Order[]; invoices: Invoice[]; subscriptions: Subscription[] };

const money = (currency: string, value: number) => `${currency} ${Number(value).toLocaleString()}`;
const statusTone = (status: string) => status === 'paid' || status === 'active' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' : status === 'failed' || status === 'cancelled' ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400';

export default function BillingPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/billing/summary', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'We could not load your billing information.');
      setSummary(result as Summary);
    } catch (err) { setError(err instanceof Error ? err.message : 'We could not load your billing information.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) void load(); }, [user]);

  const invoices = summary?.invoices ?? [];
  const subscriptions = summary?.subscriptions ?? [];
  const orders = summary?.orders ?? [];
  const openInvoices = invoices.filter((invoice) => invoice.status === 'open').length;

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><div className="flex items-center gap-3"><span className="font-display text-lg font-bold tracking-tight">HostSuite</span><Button size="sm" variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button></div></div></header>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div><p className="text-sm font-medium text-primary">Billing</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Payments & services</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Your real payment history, invoices and recurring services. HostSuite only shows records returned from your billing account.</p></div>
      {error && <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p className="font-semibold">We’re having trouble loading your billing information.</p><p className="mt-1 text-muted-foreground">This is a temporary problem on our side. Your billing records have not been changed. Please try again shortly.</p></div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><CardContent className="p-5"><Wallet className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Open invoices</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : openInvoices}</p></CardContent></Card><Card><CardContent className="p-5"><Receipt className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Active subscriptions</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : subscriptions.filter((item) => item.status === 'active').length}</p></CardContent></Card><Card><CardContent className="p-5"><CreditCard className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Payment gateway</p><p className="mt-1 text-xl font-semibold capitalize">{summary?.provider.provider ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">{summary?.provider.configured ? 'Ready' : 'Temporarily unavailable'}</p></CardContent></Card><Card><CardContent className="p-5"><FileText className="h-5 w-5 text-primary" /><p className="mt-4 text-xs text-muted-foreground">Invoices</p><p className="mt-1 text-xl font-semibold">{loading ? '—' : invoices.length}</p></CardContent></Card></div>

      <Card className="mt-6"><CardHeader><CardTitle>Subscriptions</CardTitle><CardDescription>Recurring services and their next billing dates.</CardDescription></CardHeader><CardContent>{subscriptions.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No recurring services are recorded for your account yet.</p> : <div className="space-y-2">{subscriptions.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-medium">{item.service_name}</p><p className="mt-1 text-sm text-muted-foreground">{money(item.currency, item.amount)} / {item.interval} · Auto-renew {item.auto_renew ? 'on' : 'off'}</p></div><div className="text-right"><Badge variant="outline" className={statusTone(item.status)}>{item.status.replaceAll('_', ' ')}</Badge><p className="mt-1 text-xs text-muted-foreground">{item.next_billing_at ? `Next: ${new Date(item.next_billing_at).toLocaleDateString()}` : 'No next billing date'}</p></div></div>)}</div>}</CardContent></Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Payment history</CardTitle><CardDescription>Orders confirmed by HostSuite’s payment workflow.</CardDescription></CardHeader><CardContent>{orders.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No payments are recorded yet.</p> : <div className="space-y-2">{orders.map((order) => <div key={order.id} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-medium">{money(order.currency, Number(order.total))}</p><p className="mt-1 text-xs text-muted-foreground">{order.provider ?? 'Payment'} · {new Date(order.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className={statusTone(order.status)}>{order.status}</Badge></div>)}</div>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Invoices belonging to your HostSuite account.</CardDescription></CardHeader><CardContent>{invoices.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No invoices are recorded yet.</p> : <div className="space-y-2">{invoices.map((invoice) => <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-medium">{invoice.invoice_number}</p><p className="mt-1 text-xs text-muted-foreground">{money(invoice.currency, Number(invoice.total))} · {new Date(invoice.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className={statusTone(invoice.status)}>{invoice.status}</Badge></div>)}</div>}</CardContent></Card></div>
    </main>
  </div>;
}

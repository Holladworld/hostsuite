'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CreditCard,
  Globe,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  Server,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Client = { id: string; company_name: string | null; corporate_email: string | null; subscription_tier: string; created_at: string };
type Service = { id: string; user_id: string; service_type: string; service_name: string; status: string; provider: string | null; provider_resource_id: string | null; last_error: string | null; created_at: string; updated_at: string };
type Order = { id: string; user_id: string; status: string; total: number; currency: string; provider: string | null; provider_reference: string | null; created_at: string; paid_at: string | null };
type Domain = { id: string; user_id: string; domain: string; status: string; plan_tier: string; ssl_active: boolean; uptime_pct: number; created_at: string };
type Invoice = { id: string; user_id: string; invoice_number: string; status: string; total: number; currency: string; due_at: string | null; paid_at: string | null; created_at: string };
type Attempt = { id: string; service_instance_id: string; provider: string; status: string; error_code: string | null; error_message: string | null; created_at: string; finished_at: string | null };
type Webhook = { id: string; provider: string; event_id: string; event_type: string; signature_valid: boolean; processed: boolean; received_at: string; processed_at: string | null };

type Section = 'overview' | 'customers' | 'orders' | 'services' | 'domains' | 'billing' | 'provider';

const sections: { id: Section; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'customers', label: 'Customers' },
  { id: 'orders', label: 'Orders' },
  { id: 'services', label: 'Services' },
  { id: 'domains', label: 'Domains' },
  { id: 'billing', label: 'Billing' },
  { id: 'provider', label: 'Provider & Webhooks' },
];

const tone = (status: string) => {
  if (['active', 'paid', 'succeeded', 'processed'].includes(status)) return 'bg-success/10 text-success border-success/20';
  if (['failed', 'provisioning_failed', 'cancelled', 'refunded'].includes(status)) return 'bg-destructive/10 text-destructive border-destructive/20';
  return 'bg-warning/10 text-warning border-warning/20';
};

export function AdminOperationsPanel() {
  const [section, setSection] = useState<Section>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('service_instances').select('id,user_id,service_type,service_name,status,provider,provider_resource_id,last_error,created_at,updated_at').order('updated_at', { ascending: false }).limit(200),
      supabase.from('billing_orders').select('id,user_id,status,total,currency,provider,provider_reference,created_at,paid_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('domains').select('id,user_id,domain,status,plan_tier,ssl_active,uptime_pct,created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('billing_invoices').select('id,user_id,invoice_number,status,total,currency,due_at,paid_at,created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('provisioning_attempts').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('billing_webhook_events').select('id,provider,event_id,event_type,signature_valid,processed,received_at,processed_at').order('received_at', { ascending: false }).limit(100),
    ]);

    const [clientResult, serviceResult, orderResult, domainResult, invoiceResult, attemptResult, webhookResult] = results;
    if (clientResult.data) setClients(clientResult.data as Client[]);
    if (serviceResult.data) setServices(serviceResult.data as Service[]);
    if (orderResult.data) setOrders(orderResult.data as Order[]);
    if (domainResult.data) setDomains(domainResult.data as Domain[]);
    if (invoiceResult.data) setInvoices(invoiceResult.data as Invoice[]);
    if (attemptResult.data) setAttempts(attemptResult.data as Attempt[]);
    if (webhookResult.data) setWebhooks(webhookResult.data as Webhook[]);

    const firstError = [clientResult, serviceResult, orderResult, domainResult, invoiceResult, attemptResult, webhookResult].find((r) => r.error);
    if (firstError?.error) toast.error(firstError.error.message);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => ({
    customers: clients.length,
    activeServices: services.filter((s) => s.status === 'active').length,
    pendingOrders: orders.filter((o) => ['pending', 'paid'].includes(o.status)).length,
    failedServices: services.filter((s) => s.status === 'provisioning_failed').length,
    domains: domains.length,
    openInvoices: invoices.filter((i) => i.status === 'open').length,
  }), [clients, services, orders, domains, invoices]);

  const customerName = (userId: string) => clients.find((c) => c.id === userId)?.company_name || clients.find((c) => c.id === userId)?.corporate_email || userId.slice(0, 8);
  const money = (currency: string, value: number) => `${currency} ${Number(value).toLocaleString()}`;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">HostSuite Operations</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Run the business from one place.</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Real customers, orders, services, domains, billing records and provider events. Nothing in this workspace is simulated.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Refresh
        </Button>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${section === item.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{item.label}</button>)}
      </div>

      {section === 'overview' && <Overview stats={stats} services={services} orders={orders} attempts={attempts} money={money} customerName={customerName} />}
      {section === 'customers' && <Customers clients={clients} services={services} orders={orders} customerName={customerName} />}
      {section === 'orders' && <Orders orders={orders} customerName={customerName} money={money} />}
      {section === 'services' && <Services services={services} attempts={attempts} customerName={customerName} />}
      {section === 'domains' && <Domains domains={domains} customerName={customerName} />}
      {section === 'billing' && <Billing orders={orders} invoices={invoices} money={money} />}
      {section === 'provider' && <Provider services={services} webhooks={webhooks} />}
    </div>
  );
}

function Overview({ stats, services, orders, attempts, money, customerName }: { stats: { customers: number; activeServices: number; pendingOrders: number; failedServices: number; domains: number; openInvoices: number }; services: Service[]; orders: Order[]; attempts: Attempt[]; money: (c: string, v: number) => string; customerName: (id: string) => string }) {
  const failed = services.filter((s) => s.status === 'provisioning_failed');
  return <div className="mt-6 space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <Metric icon={Users} label="Customers" value={stats.customers} />
      <Metric icon={Package} label="Active services" value={stats.activeServices} />
      <Metric icon={CreditCard} label="Pending orders" value={stats.pendingOrders} />
      <Metric icon={Globe} label="Domains" value={stats.domains} />
      <Metric icon={Wallet} label="Open invoices" value={stats.openInvoices} />
      <Metric icon={AlertTriangle} label="Provisioning failures" value={stats.failedServices} />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Needs attention</CardTitle></CardHeader><CardContent>{failed.length === 0 ? <Empty text="No provisioning failures recorded." /> : <div className="space-y-3">{failed.slice(0, 8).map((s) => <div key={s.id} className="rounded-xl border p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-medium">{s.service_name}</p><p className="text-xs text-muted-foreground">{customerName(s.user_id)} · {s.provider || 'No provider'}</p></div><Badge variant="outline" className={tone(s.status)}>Failed</Badge></div><p className="mt-2 text-sm text-destructive/90">{s.last_error || 'Provider reported a provisioning failure.'}</p></div>)}</div>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent><div className="space-y-3">{orders.slice(0, 6).map((o) => <div key={o.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium">Order {o.id.slice(0, 8)}</p><p className="text-xs text-muted-foreground">{customerName(o.user_id)} · {o.provider || 'Unpaid'}</p></div><div className="text-right"><Badge variant="outline" className={tone(o.status)}>{o.status}</Badge><p className="mt-1 text-xs text-muted-foreground">{money(o.currency, o.total)}</p></div></div>)}{orders.length === 0 && <Empty text="No orders recorded yet." />}</div></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Provisioning attempts</CardTitle></CardHeader><CardContent><div className="space-y-2">{attempts.slice(0, 8).map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div><p className="text-sm font-medium">{a.provider}</p><p className="text-xs text-muted-foreground">Service {a.service_instance_id.slice(0, 8)} · {new Date(a.created_at).toLocaleString()}</p></div><Badge variant="outline" className={tone(a.status)}>{a.status}</Badge></div>)}{attempts.length === 0 && <Empty text="No provisioning attempts recorded yet." />}</div></CardContent></Card>
  </div>;
}

function Customers({ clients, services, orders, customerName }: { clients: Client[]; services: Service[]; orders: Order[]; customerName: (id: string) => string }) {
  return <Card className="mt-6"><CardHeader><CardTitle>Customers</CardTitle></CardHeader><CardContent><TableHead cols={['Customer', 'Plan', 'Services', 'Orders', 'Joined']} />{clients.length === 0 ? <Empty text="No customer profiles recorded yet." /> : <div>{clients.map((c) => <div key={c.id} className="grid grid-cols-[minmax(0,1.7fr)_1fr_1fr_1fr_1fr] gap-3 border-b py-3 text-sm last:border-0"><div className="min-w-0"><p className="truncate font-medium">{c.company_name || 'Unnamed business'}</p><p className="truncate text-xs text-muted-foreground">{c.corporate_email || c.id}</p></div><span className="capitalize text-muted-foreground">{c.subscription_tier.replace('_', ' ')}</span><span>{services.filter((s) => s.user_id === c.id).length}</span><span>{orders.filter((o) => o.user_id === c.id).length}</span><span className="text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span></div>)}</div>}</CardContent></Card>;
}

function Orders({ orders, customerName, money }: { orders: Order[]; customerName: (id: string) => string; money: (c: string, v: number) => string }) {
  return <Card className="mt-6"><CardHeader><CardTitle>Orders</CardTitle></CardHeader><CardContent><TableHead cols={['Order', 'Customer', 'Amount', 'Payment', 'Status', 'Date']} />{orders.length === 0 ? <Empty text="No orders recorded yet." /> : orders.map((o) => <div key={o.id} className="grid grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 border-b py-3 text-sm last:border-0"><span className="font-mono-data">{o.id.slice(0, 10)}</span><span className="truncate">{customerName(o.user_id)}</span><span>{money(o.currency, o.total)}</span><span className="capitalize text-muted-foreground">{o.provider || '—'}</span><Badge variant="outline" className={`w-fit ${tone(o.status)}`}>{o.status}</Badge><span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span></div>)}</CardContent></Card>;
}

function Services({ services, attempts, customerName }: { services: Service[]; attempts: Attempt[]; customerName: (id: string) => string }) {
  return <Card className="mt-6"><CardHeader><CardTitle>Service instances</CardTitle></CardHeader><CardContent><TableHead cols={['Service', 'Customer', 'Provider', 'Resource', 'Status', 'Updated']} />{services.length === 0 ? <Empty text="No service instances recorded yet." /> : services.map((s) => { const latest = attempts.find((a) => a.service_instance_id === s.id); return <div key={s.id} className="grid grid-cols-[1.4fr_1.3fr_1fr_1.2fr_1fr_1fr] gap-3 border-b py-3 text-sm last:border-0"><div><p className="font-medium">{s.service_name}</p><p className="text-xs text-muted-foreground">{s.service_type}</p></div><span className="truncate">{customerName(s.user_id)}</span><span>{s.provider || '—'}</span><span className="truncate font-mono-data text-xs">{s.provider_resource_id || 'Not provisioned'}</span><Badge variant="outline" className={`w-fit ${tone(s.status)}`}>{s.status.replaceAll('_', ' ')}</Badge><span className="text-xs text-muted-foreground">{latest ? new Date(latest.created_at).toLocaleString() : new Date(s.updated_at).toLocaleString()}</span></div>; })}</CardContent></Card>;
}

function Domains({ domains, customerName }: { domains: Domain[]; customerName: (id: string) => string }) {
  return <Card className="mt-6"><CardHeader><CardTitle>Domain inventory</CardTitle></CardHeader><CardContent><TableHead cols={['Domain', 'Customer', 'Plan', 'SSL', 'Uptime', 'Status']} />{domains.length === 0 ? <Empty text="No domains recorded yet." /> : domains.map((d) => <div key={d.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_.7fr_1fr_1fr] gap-3 border-b py-3 text-sm last:border-0"><span className="font-medium">{d.domain}</span><span className="truncate">{customerName(d.user_id)}</span><span className="capitalize text-muted-foreground">{d.plan_tier.replace('_', ' ')}</span><span>{d.ssl_active ? 'On' : 'Off'}</span><span>{Number(d.uptime_pct).toFixed(2)}%</span><Badge variant="outline" className={`w-fit ${tone(d.status)}`}>{d.status.replaceAll('_', ' ')}</Badge></div>)}</CardContent></Card>;
}

function Billing({ orders, invoices, money }: { orders: Order[]; invoices: Invoice[]; money: (c: string, v: number) => string }) {
  return <div className="mt-6 grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle>Payment orders</CardTitle></CardHeader><CardContent><div className="space-y-2">{orders.slice(0, 20).map((o) => <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{money(o.currency, o.total)}</p><p className="text-xs text-muted-foreground">{o.provider || 'No gateway'} · {o.provider_reference || 'No provider reference'}</p></div><Badge variant="outline" className={tone(o.status)}>{o.status}</Badge></div>)}{orders.length === 0 && <Empty text="No payment orders recorded yet." />}</div></CardContent></Card><Card><CardHeader><CardTitle>Invoices</CardTitle></CardHeader><CardContent><div className="space-y-2">{invoices.slice(0, 20).map((i) => <div key={i.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{i.invoice_number}</p><p className="text-xs text-muted-foreground">{money(i.currency, i.total)} · {new Date(i.created_at).toLocaleDateString()}</p></div><Badge variant="outline" className={tone(i.status)}>{i.status}</Badge></div>)}{invoices.length === 0 && <Empty text="No invoices recorded yet." />}</div></CardContent></Card></div>;
}

function Provider({ services, webhooks }: { services: Service[]; webhooks: Webhook[] }) {
  const providerCounts = services.reduce<Record<string, number>>((acc, s) => { const key = s.provider || 'unassigned'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  return <div className="mt-6 grid gap-6 xl:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Provider usage</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(providerCounts).map(([provider, count]) => <div key={provider} className="flex items-center justify-between rounded-xl border p-4"><span className="capitalize font-medium">{provider}</span><Badge variant="outline">{count} service{count === 1 ? '' : 's'}</Badge></div>)}{Object.keys(providerCounts).length === 0 && <Empty text="No provider-backed services recorded yet." />}</div><p className="mt-5 text-xs text-muted-foreground">Provider credentials and secrets are never displayed here. Operational actions should remain capability-gated by the provider adapter.</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Webhook events</CardTitle></CardHeader><CardContent><div className="space-y-2">{webhooks.slice(0, 20).map((w) => <div key={w.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{w.provider} · {w.event_type}</p><p className="truncate text-xs text-muted-foreground">{w.event_id} · {new Date(w.received_at).toLocaleString()}</p></div><div className="flex shrink-0 gap-1.5"><Badge variant="outline" className={w.signature_valid ? tone('succeeded') : tone('failed')}>{w.signature_valid ? 'Verified' : 'Invalid'}</Badge><Badge variant="outline" className={w.processed ? tone('processed') : tone('pending')}>{w.processed ? 'Processed' : 'Pending'}</Badge></div></div>)}{webhooks.length === 0 && <Empty text="No webhook events recorded yet." />}</div></CardContent></Card></div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) { return <Card><CardContent className="p-4"><Icon className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }
function TableHead({ cols }: { cols: string[] }) { return <div className={`mb-1 hidden gap-3 border-b pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid`} style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>{cols.map((c) => <span key={c}>{c}</span>)}</div>; }

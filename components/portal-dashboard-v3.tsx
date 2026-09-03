'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Globe, Mail, Server, WandSparkles, Loader2, LogOut, LifeBuoy, Plus, Settings2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, useAuth } from '@/lib/supabase-client';

type Instance = { id: string; service_type: string; service_name: string; status: string; configuration: Record<string, unknown> | null; provider_status: string | null };
type ManagedAsset = { id: string; service_type: string; name: string; identifier: string; provider_name: string | null; management_mode: string; status: string };

const cards = [
  { type: 'hosting', label: 'Hosting', description: 'Buy hosting or manage the hosting you already have.', href: '/portal/hosting', icon: Server },
  { type: 'domain', label: 'Domain', description: 'Register a domain or manage one you already own.', href: '/portal/domains', icon: Globe },
  { type: 'email', label: 'Business email', description: 'Create mailboxes or manage your existing email.', href: '/portal/email', icon: Mail },
  { type: 'website', label: 'Website', description: 'Build, connect, publish or manage your website.', href: '/portal/websites', icon: WandSparkles },
];

function statusLabel(status: string) { return status.replaceAll('_', ' '); }
function statusTone(status: string) {
  if (status === 'active') return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400';
  if (['provisioning', 'paid', 'pending_setup'].includes(status)) return 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400';
  if (['provisioning_failed', 'attention_needed', 'disconnected'].includes(status)) return 'border-destructive/20 bg-destructive/5 text-destructive';
  return 'border-border bg-muted/30 text-muted-foreground';
}

export function PortalDashboardV3() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data, error }, assetResponse] = await Promise.all([
        supabase.from('service_instances').select('id,service_type,service_name,status,configuration,provider_status').eq('user_id', user.id).order('created_at', { ascending: false }),
        fetch('/api/managed-assets').catch(() => null),
      ]);
      setInstances((data as Instance[]) ?? []);
      setDataError(Boolean(error));
      if (assetResponse?.ok) {
        const result = await assetResponse.json() as { assets?: ManagedAsset[] };
        setAssets(result.assets ?? []);
      } else setAssets([]);
    })();
  }, [user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }

  const allServices = [
    ...instances.map((item) => ({ id: item.id, type: item.service_type, name: item.service_name, status: item.status, href: `/portal/services/${item.id}`, origin: 'HostSuite' })),
    ...assets.map((item) => ({ id: item.id, type: item.service_type, name: item.name, status: item.status, href: `/portal/managed-assets/${item.id}`, origin: item.provider_name || 'Existing service' })),
  ];
  const activeCount = dataError ? null : instances.filter((item) => item.status === 'active').length;
  const attentionCount = dataError ? null : instances.filter((item) => ['paid', 'provisioning', 'provisioning_failed'].includes(item.status)).length + assets.filter((item) => ['attention_needed', 'disconnected'].includes(item.status)).length;

  return <div className="min-h-screen bg-background">
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden"><Link href="/portal/dashboard" className="font-display text-lg font-bold">HostSuite</Link></div>
        <div className="hidden lg:block"><span className="text-sm text-muted-foreground">Client workspace</span></div>
        <div className="flex items-center gap-3"><span className="hidden max-w-52 truncate text-sm text-muted-foreground sm:block">{user.email}</span><Button size="sm" variant="outline" onClick={async () => { await signOut(); router.push('/portal'); }}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Your business workspace</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Manage services you already own, start something new, or get help when something needs attention.</p>
      </section>

      {dataError && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold">We can't load your purchased services right now.</p><p className="mt-1 text-muted-foreground">Your account has not been changed. HostSuite will not invent service records when the service database is unavailable.</p></div></div>}

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <Link href="/portal/services" className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Manage what I have</h2><p className="mt-1 text-sm text-muted-foreground">Open hosting, domains, email and websites already connected to your workspace.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Manage services <ArrowRight className="ml-1 h-4 w-4" /></span></Link>
        <Link href="/portal/hosting" className="group rounded-2xl border border-primary/20 bg-primary/5 p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-primary"><Plus className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Get started</h2><p className="mt-1 text-sm text-muted-foreground">Buy hosting now or tell us about hosting you already have. You stay in the client workspace.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Open hosting <ArrowRight className="ml-1 h-4 w-4" /></span></Link>
        <Link href="/portal/support" className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LifeBuoy className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Ask HostSuite</h2><p className="mt-1 text-sm text-muted-foreground">Hand a technical issue to us instead of figuring it out alone.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Get help <ArrowRight className="ml-1 h-4 w-4" /></span></Link>
      </section>

      {!dataError && <section className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Services</p><p className="mt-1 text-2xl font-bold">{allServices.length}</p></div><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Active</p><p className="mt-1 text-2xl font-bold">{activeCount}</p></div><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-bold">{attentionCount}</p></div></section>}

      <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Your services</h2><p className="mt-1 text-sm text-muted-foreground">Purchased HostSuite services and external services you asked us to manage.</p></div><Button asChild variant="ghost" size="sm"><Link href="/portal/services">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>
        {dataError ? <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><p className="font-medium">Your services will appear here when the connection is restored.</p></div> : allServices.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed p-8"><p className="font-medium">Nothing is connected yet.</p><p className="mt-1 max-w-xl text-sm text-muted-foreground">Start with hosting, or add a domain, website, email or hosting account you already have.</p><div className="mt-4"><Button asChild><Link href="/portal/hosting">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div> : <div className="mt-4 space-y-2">{allServices.slice(0, 6).map((item) => <Link key={`${item.origin}-${item.id}`} href={item.href} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40"><div className="flex min-w-0 items-center gap-3"><div className="h-2 w-2 shrink-0 rounded-full bg-primary"/><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.origin} · {item.type.replaceAll('_', ' ')}</p></div></div><Badge variant="outline" className={statusTone(item.status)}>{statusLabel(item.status)}</Badge></Link>)}</div>}
      </section>
    </main>
  </div>;
}

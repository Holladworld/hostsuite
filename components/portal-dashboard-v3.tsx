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
  { type: 'hosting', label: 'Hosting', description: 'Get hosting or manage the hosting you already have.', href: '/portal/hosting', icon: Server },
  { type: 'domain', label: 'Domain', description: 'Get a domain or manage one you already own.', href: '/portal/domains', icon: Globe },
  { type: 'email', label: 'Business email', description: 'Set up professional email or manage your existing email.', href: '/portal/email', icon: Mail },
  { type: 'website', label: 'Website', description: 'Build, fix, update or manage your website.', href: '/portal/websites', icon: WandSparkles },
];

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

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
  const [assetsError, setAssetsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data, error }, assetResponse] = await Promise.all([
        supabase.from('service_instances').select('id,service_type,service_name,status,configuration,provider_status').eq('user_id', user.id).order('created_at', { ascending: false }),
        fetch('/api/managed-assets').catch(() => null),
      ]);
      setInstances((data as Instance[]) ?? []);
      setDataError(Boolean(error));
      if (!assetResponse || !assetResponse.ok) {
        setAssets([]);
        setAssetsError(true);
      } else {
        const result = await assetResponse.json() as { assets?: ManagedAsset[] };
        setAssets(result.assets ?? []);
        setAssetsError(false);
      }
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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/portal/dashboard" className="font-display text-lg font-bold tracking-tight">HostSuite <span className="ml-1 text-xs font-normal text-muted-foreground">Client Portal</span></Link>
        <div className="flex items-center gap-3"><span className="hidden max-w-52 truncate text-sm text-muted-foreground sm:block">{user.email}</span><Button size="sm" variant="outline" onClick={async () => { await signOut(); router.push('/portal'); }}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-medium text-primary">Welcome back</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">What do you need help with?</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Manage what you already have, get something new, or tell us when something is not working.</p>
      </section>

      {dataError && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold">We can't load your services right now.</p><p className="mt-1 text-muted-foreground">Your account has not been changed. The service database is not available in this environment yet, so we won't guess or show fake services.</p></div></div>}

      <section className="mt-7 grid gap-4 md:grid-cols-3">
        <Link href="/portal/services" className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Settings2 className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Manage my services</h2><p className="mt-1 text-sm text-muted-foreground">See your domains, hosting, email and websites in one place.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">View services <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span></Link>
        <Link href="/portal/services" className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Get something new</h2><p className="mt-1 text-sm text-muted-foreground">Need a domain, hosting, email or website? Start here.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Get started <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span></Link>
        <Link href="/portal/services" className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LifeBuoy className="h-5 w-5" /></div><h2 className="mt-4 font-semibold">Something isn't working</h2><p className="mt-1 text-sm text-muted-foreground">Start with the service that is giving you trouble. We'll guide you from there.</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Find help <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span></Link>
      </section>

      {!dataError && <section className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Services</p><p className="mt-1 text-2xl font-bold">{allServices.length}</p></div><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Active</p><p className="mt-1 text-2xl font-bold">{activeCount}</p></div><div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">Needs attention</p><p className="mt-1 text-2xl font-bold">{attentionCount}</p></div></section>}

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">My services</h2><p className="mt-1 text-sm text-muted-foreground">Everything HostSuite provides or helps you manage.</p></div><Button asChild variant="ghost" size="sm"><Link href="/portal/services">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button></div>
        {dataError ? <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><p className="font-medium">Your services will appear here when the connection is restored.</p><p className="mt-1 text-sm text-muted-foreground">You can still explore the service centre.</p></div> : allServices.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed p-8"><p className="font-medium">Nothing here yet.</p><p className="mt-1 max-w-xl text-sm text-muted-foreground">Already have a domain, website, hosting or email somewhere else? Add it to HostSuite. Or start something new.</p><div className="mt-4"><Button asChild><Link href="/portal/services">Explore services <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div> : <div className="mt-4 space-y-2">{allServices.slice(0, 6).map((item) => <Link key={`${item.origin}-${item.id}`} href={item.href} className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary/40"><div className="flex min-w-0 items-center gap-3"><div className="h-2 w-2 shrink-0 rounded-full bg-primary"/><div className="min-w-0"><p className="truncate font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.origin} · {item.type.replaceAll('_', ' ')}</p></div></div><Badge variant="outline" className={statusTone(item.status)}>{statusLabel(item.status)}</Badge></Link>)}</div>}
        {assetsError && !dataError && <p className="mt-3 text-xs text-muted-foreground">Existing services could not be checked right now.</p>}
      </section>

      <section className="mt-10 rounded-2xl border bg-card p-5 sm:p-6"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><LifeBuoy className="h-5 w-5" /></div><div><h2 className="font-semibold">Not sure what you need?</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">That's okay. Pick the service closest to your problem and HostSuite will help you work out the next step.</p></div></div></section>
    </main>
  </div>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Mail, Server, WandSparkles, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';

type Instance = { id: string; service_type: string; service_name: string; status: string; provider: string | null; provider_status: string | null; configuration: Record<string, unknown> | null };
type ManagedAsset = { id: string; service_type: string; name: string; identifier: string; provider_name: string | null; management_mode: string; status: string };

const services = [
  { type: 'hosting', label: 'Hosting', description: 'Get hosting or manage the hosting you already have.', icon: Server, href: '/portal/hosting' },
  { type: 'domain', label: 'Domain', description: 'Get a domain or manage one you already own.', icon: Globe, href: '/portal/domains' },
  { type: 'email', label: 'Business email', description: 'Set up professional email or manage your existing email.', icon: Mail, href: '/portal/email' },
  { type: 'website', label: 'Website', description: 'Build, fix, update or manage your website.', icon: WandSparkles, href: '/portal/websites' },
];

function statusLabel(status: string) { return status.replaceAll('_', ' '); }

export function PortalServiceHub() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data, error }, assetResponse] = await Promise.all([
        supabase.from('service_instances').select('id,service_type,service_name,status,provider,provider_status,configuration').eq('user_id', user.id).order('created_at', { ascending: false }),
        fetch('/api/managed-assets').catch(() => null),
      ]);
      if (error) {
        setDataError(true);
        setInstances([]);
      } else {
        setDataError(false);
        setInstances((data as Instance[]) ?? []);
      }
      if (assetResponse?.ok) {
        const result = await assetResponse.json() as { assets?: ManagedAsset[] };
        setAssets(result.assets ?? []);
      } else setAssets([]);
      setLoadingData(false);
    })();
  }, [user]);

  if (loading || loadingData) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/portal/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">← Back to dashboard</Link>
    <div className="mt-8 max-w-2xl"><p className="text-sm font-medium text-primary">My services</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">What would you like to manage?</h1><p className="mt-2 text-muted-foreground">Choose a service you already have, or start something new. Your service can stay with HostSuite or another provider.</p></div>

    {dataError && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/><div><p className="font-semibold">We can't load your HostSuite services right now.</p><p className="mt-1 text-muted-foreground">The service database is not available in this environment yet. We won't guess or show fake services.</p></div></div>}

    <section className="mt-8 grid gap-4 md:grid-cols-2">{services.map(({ type, label, description, icon: Icon, href }) => { const mine = instances.filter((item) => item.service_type === type); const external = assets.filter((item) => item.service_type === type); const count = mine.length + external.length; return <Card key={type} className="overflow-hidden"><CardContent className="p-0"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div>{!dataError && <Badge variant="outline">{count ? `${count} ${count === 1 ? 'service' : 'services'}` : 'Not added yet'}</Badge>}</div><h2 className="mt-5 text-xl font-semibold">{label}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>{!dataError && count > 0 && <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">{mine.slice(0, 2).map((item) => <Link key={item.id} href={`/portal/services/${item.id}`} className="flex items-center justify-between gap-4 rounded-xl border bg-background p-3 transition hover:border-primary/40"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.service_name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">HostSuite · {statusLabel(item.status)}</p></div><ArrowRight className="h-4 w-4 shrink-0"/></Link>)}{external.slice(0, 2).map((item) => <Link key={item.id} href={`/portal/managed-assets/${item.id}`} className="mt-2 flex items-center justify-between gap-4 rounded-xl border bg-background p-3 transition hover:border-primary/40"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.provider_name || 'Existing service'} · {item.management_mode === 'hostsuite' ? 'HostSuite managed' : item.management_mode === 'self' ? 'You manage it' : 'Guided setup'}</p></div><ExternalLink className="h-4 w-4 shrink-0"/></Link>)}</div>}<div className="border-t p-4 sm:p-5"><Button asChild variant={count ? 'outline' : 'default'} className="w-full justify-between"><Link href={href}>{count ? `Open ${label.toLowerCase()}` : `Get or add ${label.toLowerCase()}`}<ArrowRight className="h-4 w-4"/></Link></Button></div></CardContent></Card>; })}</section>

    <section className="mt-8 rounded-2xl border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Already have something somewhere else?</p><p className="mt-1 max-w-2xl text-sm text-muted-foreground">You don't have to move it first. Open the service above and tell HostSuite what you already have.</p></div><Button asChild variant="outline"><Link href="/portal/hosting">Tell us what you have <ArrowRight className="ml-2 h-4 w-4"/></Link></Button></div></section>
  </div></main>;
}

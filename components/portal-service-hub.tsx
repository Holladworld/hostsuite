'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe, Mail, Server, WandSparkles, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Instance = { id: string; service_type: string; service_name: string; status: string; provider: string | null; provider_status: string | null; provider_resource_id: string | null; control_panel_url: string | null; configuration: Record<string, unknown> | null };

const services = [
  { type: 'hosting', label: 'Hosting', description: 'Buy a hosting plan or manage the hosting you already have.', icon: Server, buy: '/portal/hosting' },
  { type: 'domain', label: 'Domains', description: 'Register a new domain or manage domains on your account.', icon: Globe, buy: '/portal/domains' },
  { type: 'email', label: 'Business Email', description: 'Buy mailbox capacity or manage your business email service.', icon: Mail, buy: '/portal/email' },
  { type: 'website', label: 'Website', description: 'Start a website or manage a website service you purchased.', icon: WandSparkles, buy: '/portal/websites' },
];

export function PortalServiceHub() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase.from('service_instances').select('id,service_type,service_name,status,provider,provider_status,provider_resource_id,control_panel_url,configuration').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) toast.error('We could not load your services.');
      setInstances((data as Instance[]) ?? []);
      setLoadingData(false);
    })();
  }, [user]);

  if (loading || loadingData) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/portal/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</Link>
    <div className="mt-8"><p className="text-sm font-medium text-primary">Service centre</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Buy or manage your services</h1><p className="mt-2 max-w-2xl text-muted-foreground">You do not have to start from the landing page again. Pick a service to manage an existing purchase or start a new one.</p></div>

    <section className="mt-8 grid gap-4 md:grid-cols-2">{services.map(({ type, label, description, icon: Icon, buy }) => { const mine = instances.filter((item) => item.service_type === type); return <Card key={type}><CardHeader><div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><Badge variant="outline">{mine.length ? `${mine.length} active/purchased` : 'Not purchased'}</Badge></div><CardTitle className="mt-3">{label}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="space-y-2">{mine.slice(0, 3).map((instance) => <div key={instance.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{instance.service_name}</p><p className="mt-0.5 text-xs text-muted-foreground">{instance.status.replaceAll('_', ' ')}</p></div><Button asChild size="sm"><Link href={`/portal/services/${instance.id}`}>Manage <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button></div>)}</div><Button asChild variant={mine.length ? 'outline' : 'default'} className="mt-4 w-full gap-2"><Link href={buy}><Plus className="h-4 w-4" />{mine.length ? `Buy another ${label.toLowerCase()}` : `Get ${label.toLowerCase()}`}</Link></Button></CardContent></Card>; })}</section>

    <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Need us to do it for you?</p><p className="mt-1 text-sm text-muted-foreground">Ask HostSuite for managed setup instead of using self-service.</p></div><Button asChild variant="outline"><Link href="/portal/support">Ask HostSuite</Link></Button></CardContent></Card>
  </div></main>;
}

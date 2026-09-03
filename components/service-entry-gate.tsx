'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Loader2, Mail, Plus, Server, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ServicePurchaseFlow } from '@/components/service-purchase-flow';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type ServiceType = 'hosting' | 'domain' | 'email' | 'website';
type Instance = { id: string; service_name: string; status: string; configuration: Record<string, unknown> | null; provider_status: string | null };

const labels: Record<ServiceType, { label: string; icon: typeof Server; description: string }> = {
  hosting: { label: 'Hosting', icon: Server, description: 'Run your website or application on a hosting plan.' },
  domain: { label: 'Domain', icon: Globe, description: 'Register and manage your internet address.' },
  email: { label: 'Business Email', icon: Mail, description: 'Use professional mailboxes on your business domain.' },
  website: { label: 'Website', icon: WandSparkles, description: 'Build, publish and manage your business website.' },
};

export function ServiceEntryGate({ service }: { service: ServiceType }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [checking, setChecking] = useState(true);
  const [choice, setChoice] = useState<'buy' | 'manage' | null>(null);
  const meta = labels[service];
  const Icon = meta.icon;

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase.from('service_instances').select('id,service_name,status,configuration,provider_status').eq('user_id', user.id).eq('service_type', service).order('created_at', { ascending: false });
      if (error) {
        setInstances([]);
        const message = error.message?.toLowerCase().includes('relation') || error.code === '42P01'
          ? 'Your service database has not been migrated yet. Run the current Supabase migrations before using the service centre.'
          : 'We could not check your existing services.';
        toast.error(message);
      } else {
        setInstances((data as Instance[]) ?? []);
      }
      setChecking(false);
    })();
  }, [user, service]);

  if (loading || checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }
  if (choice === 'buy') return <ServicePurchaseFlow service={service} />;

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/portal/services" className="text-sm text-muted-foreground hover:text-foreground">← Back to service centre</Link>
    <div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">{meta.label}</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">What would you like to do?</h1><p className="mt-2 max-w-2xl text-muted-foreground">Manage a {service} service you already own, or start a new purchase. HostSuite will not send you back to the marketing site.</p></div></div>

    {instances.length > 0 ? <section className="mt-8 grid gap-4 lg:grid-cols-2">
      <Card className="border-primary/30"><CardHeader><Badge className="w-fit">{instances.length} on your account</Badge><CardTitle className="mt-2">Manage an existing {meta.label.toLowerCase()}</CardTitle><CardDescription>Open the service you already purchased to see its configuration, status and available actions.</CardDescription></CardHeader><CardContent className="space-y-2">{instances.map((item) => <Link key={item.id} href={`/portal/services/${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:border-primary/50"><div className="min-w-0"><p className="truncate font-medium">{item.service_name}</p><p className="mt-1 text-xs text-muted-foreground">{item.status.replaceAll('_', ' ')}{item.provider_status ? ` · ${item.provider_status}` : ''}</p></div><ArrowRight className="h-4 w-4 shrink-0" /></Link>)}<Button variant="outline" className="mt-2 w-full" onClick={() => setChoice('buy')}><Plus className="mr-2 h-4 w-4" /> Buy another</Button></CardContent></Card>
      <Card><CardHeader><CheckCircle2 className="h-6 w-6 text-primary" /><CardTitle className="mt-2">Start something new</CardTitle><CardDescription>Choose another plan or add another service without affecting the services you already own.</CardDescription></CardHeader><CardContent><Button className="w-full gap-2" onClick={() => setChoice('buy')}>Buy a new {meta.label.toLowerCase()} <ArrowRight className="h-4 w-4" /></Button></CardContent></Card>
    </section> : <section className="mt-8"><Card><CardHeader><CardTitle>You don't have a {meta.label.toLowerCase()} yet</CardTitle><CardDescription>Let's set one up. You'll choose the plan and configuration before payment.</CardDescription></CardHeader><CardContent><Button className="gap-2" onClick={() => setChoice('buy')}>Get {meta.label.toLowerCase()} <ArrowRight className="h-4 w-4" /></Button></CardContent></Card></section>}
  </div></main>;
}

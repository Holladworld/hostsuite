'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Loader2, Mail, Server, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ServicePurchaseFlow } from '@/components/service-purchase-flow';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type ServiceType = 'hosting' | 'domain' | 'email' | 'website';
type Instance = { id: string; service_name: string; status: string; configuration: Record<string, unknown> | null; provider_status: string | null };
type Origin = 'existing' | 'new' | null;
type ManagementMode = 'self' | 'hostsuite' | 'help' | null;
type ManagedAsset = { id: string; service_type: ServiceType; name: string; identifier: string; provider_name: string | null; management_mode: string; status: string };

const labels: Record<ServiceType, { label: string; icon: typeof Server }> = {
  hosting: { label: 'Hosting', icon: Server },
  domain: { label: 'Domain', icon: Globe },
  email: { label: 'Business Email', icon: Mail },
  website: { label: 'Website', icon: WandSparkles },
};

export function ServiceEntryGate({ service }: { service: ServiceType }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [checking, setChecking] = useState(true);
  const [origin, setOrigin] = useState<Origin>(null);
  const [management, setManagement] = useState<ManagementMode>(null);
  const [existingProvider, setExistingProvider] = useState('');
  const [existingIdentifier, setExistingIdentifier] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAsset, setSavedAsset] = useState<ManagedAsset | null>(null);
  const meta = labels[service];
  const Icon = meta.icon;

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [instanceResult, assetResult] = await Promise.all([
        supabase.from('service_instances').select('id,service_name,status,configuration,provider_status').eq('user_id', user.id).eq('service_type', service).order('created_at', { ascending: false }),
        fetch('/api/managed-assets', { headers: await getAuthHeaders() }).then(async (response) => response.ok ? response.json() as Promise<{ assets?: ManagedAsset[] }> : { assets: [] }).catch(() => ({ assets: [] })),
      ]);
      if (instanceResult.error) {
        setInstances([]);
        if (!(instanceResult.error.message?.toLowerCase().includes('relation') || instanceResult.error.code === '42P01')) toast.error('We could not check your existing HostSuite services.');
      } else setInstances((instanceResult.data as Instance[]) ?? []);
      setAssets(assetResult.assets?.filter((asset) => asset.service_type === service) ?? []);
      setChecking(false);
    })();
  }, [user, service]);

  async function getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  if (loading || checking) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }

  if (origin === 'new') {
    return <ServicePurchaseFlow service={service} managementMode={management === 'hostsuite' || management === 'help' ? management : 'self'} />;
  }

  async function saveExisting() {
    if (!existingIdentifier.trim() || !management) return;
    setSaving(true);
    try {
      const response = await fetch('/api/managed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          serviceType: service,
          name: existingIdentifier.trim(),
          identifier: existingIdentifier.trim(),
          providerName: existingProvider.trim() || null,
          managementMode: management,
          details: { source: 'customer_existing_service' },
        }),
      });
      const result = await response.json() as { asset?: ManagedAsset; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? 'Unable to save this service.');
      setSavedAsset(result.asset);
      setAssets((current) => [result.asset!, ...current]);
      toast.success('Your existing service has been added to HostSuite.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save this service.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to service centre</Link>
    <div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">{meta.label}</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">What do you need?</h1><p className="mt-2 max-w-2xl text-muted-foreground">Whether you already have this service or need something new, HostSuite can help you manage it yourself or handle it for you.</p></div></div>

    {origin === null && <>
      <section className="mt-8 grid gap-4 md:grid-cols-2"><Card className="cursor-pointer border-primary/30 transition hover:border-primary" onClick={() => { setOrigin('existing'); setManagement(null); setSavedAsset(null); }}><CardHeader><Badge className="w-fit">Already have it?</Badge><CardTitle className="mt-2">I already have {meta.label.toLowerCase()}</CardTitle><CardDescription>It can be with HostSuite or another provider. We can help you manage, fix or connect it.</CardDescription></CardHeader><CardContent><Button className="w-full gap-2" onClick={(event) => { event.stopPropagation(); setOrigin('existing'); setManagement(null); setSavedAsset(null); }}>I already have it <ArrowRight className="h-4 w-4" /></Button></CardContent></Card><Card className="cursor-pointer transition hover:border-primary/50" onClick={() => setOrigin('new')}><CardHeader><Badge variant="outline" className="w-fit">Starting fresh</Badge><CardTitle className="mt-2">I need something new</CardTitle><CardDescription>Choose a product and decide whether you want to manage it yourself or have HostSuite handle it.</CardDescription></CardHeader><CardContent><Button variant="outline" className="w-full gap-2" onClick={(event) => { event.stopPropagation(); setOrigin('new'); }}>Get something new <ArrowRight className="h-4 w-4" /></Button></CardContent></Card></section>
      {instances.length + assets.length > 0 && <section className="mt-10"><div className="mb-3 flex items-end justify-between"><div><h2 className="text-lg font-semibold">Your {meta.label.toLowerCase()} services</h2><p className="text-sm text-muted-foreground">HostSuite services and existing services you've asked us to track.</p></div><Badge variant="outline">{instances.length + assets.length}</Badge></div><div className="grid gap-3 md:grid-cols-2">{instances.map((item) => <Link key={item.id} href={`/portal/services/${item.id}`} className="flex items-center justify-between gap-3 rounded-2xl border p-4 transition hover:border-primary/50"><div className="min-w-0"><p className="truncate font-medium">{item.service_name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">HostSuite · {item.status.replaceAll('_', ' ')}{item.provider_status ? ` · ${item.provider_status}` : ''}</p></div><ArrowRight className="h-4 w-4 shrink-0" /></Link>)}{assets.map((asset) => <div key={asset.id} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{asset.name}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{asset.provider_name || 'External provider'} · {asset.management_mode === 'hostsuite' ? 'HostSuite managed' : asset.management_mode === 'self' ? 'Self managed' : 'Guided setup'} · {asset.status.replaceAll('_', ' ')}</p></div><Badge variant="outline">Existing</Badge></div></div>)}</div></section>}
    </>}

    {origin === 'new' && <section className="mt-8"><Card><CardHeader><CardTitle>How should HostSuite handle it?</CardTitle><CardDescription>You can manage a new service yourself, have HostSuite handle it, or ask us to guide you.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><button type="button" onClick={() => { setManagement('self'); }} className="rounded-2xl border p-5 text-left transition hover:border-primary"><p className="font-semibold">I'll manage it myself</p><p className="mt-1 text-sm text-muted-foreground">Set it up and use HostSuite's tools directly.</p></button><button type="button" onClick={() => { setManagement('hostsuite'); }} className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition hover:border-primary"><p className="font-semibold">HostSuite manages it</p><p className="mt-1 text-sm text-muted-foreground">We'll handle the setup and technical work for you.</p></button><button type="button" onClick={() => { setManagement('help'); }} className="rounded-2xl border p-5 text-left transition hover:border-primary"><p className="font-semibold">I'm not sure — help me</p><p className="mt-1 text-sm text-muted-foreground">We'll guide you to the right setup.</p></button></div><Button className="mt-5" disabled={!management} onClick={() => setOrigin('new')}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button><Button variant="ghost" className="mt-4" onClick={() => setOrigin(null)}>Back</Button></CardContent></Card></section>}

    {origin === 'existing' && !savedAsset && <section className="mt-8 space-y-5"><Card><CardHeader><CardTitle>How should HostSuite help?</CardTitle><CardDescription>This service can be with HostSuite or another provider. You don't need to move it first.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-3"><button type="button" onClick={() => setManagement('self')} className={`rounded-2xl border p-5 text-left transition ${management === 'self' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}><p className="font-semibold">I'll manage it myself</p><p className="mt-1 text-sm text-muted-foreground">Use HostSuite as your control centre.</p></button><button type="button" onClick={() => setManagement('hostsuite')} className={`rounded-2xl border p-5 text-left transition ${management === 'hostsuite' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}><p className="font-semibold">Manage it for me</p><p className="mt-1 text-sm text-muted-foreground">HostSuite takes care of the technical work.</p></button><button type="button" onClick={() => setManagement('help')} className={`rounded-2xl border p-5 text-left transition ${management === 'help' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}><p className="font-semibold">I'm not sure</p><p className="mt-1 text-sm text-muted-foreground">Tell us what you have and we'll help you figure it out.</p></button></div></CardContent></Card><Card><CardHeader><CardTitle>Tell us what you already have</CardTitle><CardDescription>You don't need to know every technical detail. Give us what you know.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><label className="text-sm font-medium">Provider (optional)</label><Input className="mt-2" value={existingProvider} onChange={(event) => setExistingProvider(event.target.value)} placeholder="e.g. WhoGoHost, GoDaddy, Cloudflare" /></div><div><label className="text-sm font-medium">{service === 'website' ? 'Website address' : service === 'domain' ? 'Domain name' : service === 'email' ? 'Domain or email address' : 'Domain, server or account'}</label><Input className="mt-2" value={existingIdentifier} onChange={(event) => setExistingIdentifier(event.target.value)} placeholder={service === 'website' ? 'https://yourbusiness.com' : 'yourbusiness.com'} /></div></CardContent></Card><div className="flex gap-3"><Button variant="outline" onClick={() => { setOrigin(null); setManagement(null); }}>Back</Button><Button className="gap-2" disabled={!existingIdentifier.trim() || !management || saving} onClick={() => void saveExisting()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Add to HostSuite <ArrowRight className="h-4 w-4" /></Button></div></section>}

    {origin === 'existing' && savedAsset && <Card className="mt-8 border-primary/30"><CardHeader><CheckCircle2 className="h-6 w-6 text-primary" /><CardTitle>Added to HostSuite</CardTitle><CardDescription>We saved this existing service to your HostSuite account. It has not been represented as a HostSuite-provisioned resource.</CardDescription></CardHeader><CardContent><div className="rounded-xl border p-4 text-sm"><p className="font-medium">{savedAsset.name}</p><p className="mt-1 text-muted-foreground">{savedAsset.provider_name || 'External provider'} · {savedAsset.management_mode === 'hostsuite' ? 'HostSuite managed' : savedAsset.management_mode === 'self' ? 'Self managed' : 'Guided setup'}</p></div><div className="mt-5 flex gap-3"><Button onClick={() => { setOrigin(null); setManagement(null); setExistingIdentifier(''); setExistingProvider(''); setSavedAsset(null); }}>Done</Button><Button variant="outline" onClick={() => setSavedAsset(null)}>Edit details</Button></div></CardContent></Card>}
  </div></main>;
}

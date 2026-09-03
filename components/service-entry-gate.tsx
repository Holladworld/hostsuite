'use client';

import { useState } from 'react';
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
type Origin = 'existing' | 'new' | null;
type ManagementMode = 'self' | 'hostsuite' | 'help' | null;
type ManagedAsset = { id: string; service_type: ServiceType; name: string; identifier: string; provider_name: string | null; management_mode: string; status: string };

const labels: Record<ServiceType, { label: string; icon: typeof Server; question: string; placeholder: string }> = {
  hosting: { label: 'Hosting', icon: Server, question: 'Where is your hosting?', placeholder: 'yourbusiness.com' },
  domain: { label: 'Domain', icon: Globe, question: 'What domain do you already have?', placeholder: 'yourbusiness.com' },
  email: { label: 'Business email', icon: Mail, question: 'What email or domain do you use?', placeholder: 'hello@yourbusiness.com or yourbusiness.com' },
  website: { label: 'Website', icon: WandSparkles, question: 'What is your website address?', placeholder: 'https://yourbusiness.com' },
};

export function ServiceEntryGate({ service }: { service: ServiceType }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [origin, setOrigin] = useState<Origin>(null);
  const [management, setManagement] = useState<ManagementMode>(null);
  const [provider, setProvider] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedAsset, setSavedAsset] = useState<ManagedAsset | null>(null);
  const meta = labels[service];
  const Icon = meta.icon;

  async function getAuthHeaders() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  }

  async function saveExisting() {
    if (!identifier.trim() || !management) return;
    setSaving(true);
    try {
      const response = await fetch('/api/managed-assets', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) }, body: JSON.stringify({ serviceType: service, name: identifier.trim(), identifier: identifier.trim(), providerName: provider.trim() || null, managementMode: management, details: { source: 'customer_existing_service' } }) });
      const result = await response.json() as { asset?: ManagedAsset; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? 'Unable to add this service.');
      setSavedAsset(result.asset);
      toast.success('Added to your HostSuite account.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to add this service.'); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }
  if (origin === 'new' && management) return <ServicePurchaseFlow service={service} managementMode={management} />;

  const reset = () => { setOrigin(null); setManagement(null); setProvider(''); setIdentifier(''); setSavedAsset(null); };
  const step = origin === null ? 1 : management === null ? 2 : 3;

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Back to services</Link>
    <div className="mt-8 flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><div><p className="text-sm font-medium text-primary">{meta.label}</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Let's get this sorted.</h1><p className="mt-2 max-w-2xl text-muted-foreground">We'll ask only what we need. Your service can stay where it is — with HostSuite or another provider.</p></div></div>

    <div className="mt-8 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className={step >= 1 ? 'text-primary' : ''}>1. What you have</span><span className="h-px flex-1 bg-border"/><span className={step >= 2 ? 'text-primary' : ''}>2. Who manages it</span><span className="h-px flex-1 bg-border"/><span className={step >= 3 ? 'text-primary' : ''}>3. Details</span></div>

    {origin === null && <section className="mt-6 grid gap-4 md:grid-cols-2"><Choice title={`I already have ${meta.label.toLowerCase()}`} description={`It may be with HostSuite or another provider. We'll help you manage or connect it.`} badge="Already have it" onClick={() => setOrigin('existing')} primary/><Choice title={`I need ${meta.label.toLowerCase()}`} description="Start from scratch and choose how much HostSuite should handle for you." badge="Starting fresh" onClick={() => setOrigin('new')}/><button type="button" onClick={() => setOrigin('existing')} className="md:col-span-2 rounded-2xl border border-dashed p-5 text-left transition hover:border-primary/50"><p className="font-semibold">I'm not sure</p><p className="mt-1 text-sm text-muted-foreground">That's okay. Tell us what you know and we'll help you work it out.</p></button></section>}

    {origin === 'existing' && !management && !savedAsset && <section className="mt-6"><Card><CardHeader><CardTitle>What would you like HostSuite to do?</CardTitle><CardDescription>Choose the level of help you want.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3"><ChoiceButton title="I'll manage it" description="I'll handle it myself." onClick={() => setManagement('self')}/><ChoiceButton title="Manage it for me" description="HostSuite handles the technical work." onClick={() => setManagement('hostsuite')} selected/><ChoiceButton title="I'm not sure" description="Guide me to the right setup." onClick={() => setManagement('help')}/><Button variant="ghost" className="mt-2 w-fit" onClick={() => setOrigin(null)}>Back</Button></CardContent></Card></section>}

    {origin === 'new' && !management && <section className="mt-6"><Card><CardHeader><CardTitle>How much should HostSuite handle?</CardTitle><CardDescription>You can manage the service yourself or have us handle the technical work.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3"><ChoiceButton title="I'll manage it" description="Give me the service and tools." onClick={() => setManagement('self')}/><ChoiceButton title="Manage it for me" description="HostSuite handles setup and technical work." onClick={() => setManagement('hostsuite')} selected/><ChoiceButton title="I'm not sure" description="Help me choose the right setup." onClick={() => setManagement('help')}/><Button variant="ghost" className="mt-2 w-fit" onClick={() => setOrigin(null)}>Back</Button></CardContent></Card></section>}

    {origin === 'existing' && management && !savedAsset && <section className="mt-6 space-y-4"><Card><CardHeader><CardTitle>{meta.question}</CardTitle><CardDescription>You don't need to know every technical detail. Give us what you know.</CardDescription></CardHeader><CardContent><Input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={meta.placeholder} autoFocus/><div className="mt-5"><p className="text-sm font-medium">Do you know who provides it?</p><p className="mt-1 text-xs text-muted-foreground">Optional. If you don't know, leave this blank.</p><Input className="mt-2" value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="e.g. WhoGoHost, GoDaddy, Cloudflare"/></div></CardContent></Card><div className="flex gap-3"><Button variant="outline" onClick={() => setManagement(null)}>Back</Button><Button disabled={!identifier.trim() || saving} onClick={() => void saveExisting()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Continue <ArrowRight className="ml-2 h-4 w-4"/></Button></div></section>}

    {origin === 'existing' && savedAsset && <Card className="mt-6 border-primary/30"><CardHeader><CheckCircle2 className="h-6 w-6 text-primary"/><CardTitle>You're all set</CardTitle><CardDescription>We've added this existing service to your HostSuite workspace. It has not been represented as a HostSuite-provisioned resource.</CardDescription></CardHeader><CardContent><div className="rounded-xl border p-4"><p className="font-medium">{savedAsset.name}</p><p className="mt-1 text-sm text-muted-foreground">{savedAsset.provider_name || 'Provider not specified'} · {savedAsset.management_mode === 'hostsuite' ? 'HostSuite manages it' : savedAsset.management_mode === 'self' ? 'You manage it' : 'Guided setup'}</p><Badge variant="outline" className="mt-3">Setup pending</Badge></div><div className="mt-5 flex gap-3"><Button onClick={reset}>Back to services</Button><Button variant="outline" onClick={() => setSavedAsset(null)}>Edit details</Button></div></CardContent></Card>}
  </div></main>;
}

function Choice({ title, description, badge, onClick, primary = false }: { title: string; description: string; badge: string; onClick: () => void; primary?: boolean }) {
  return <Card className={`cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/50 ${primary ? 'border-primary/30' : ''}`} onClick={onClick}><CardHeader><Badge variant={primary ? 'default' : 'outline'} className="w-fit">{badge}</Badge><CardTitle className="mt-2">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><Button variant={primary ? 'default' : 'outline'} className="w-full" onClick={(event) => { event.stopPropagation(); onClick(); }}>Continue <ArrowRight className="ml-2 h-4 w-4"/></Button></CardContent></Card>;
}

function ChoiceButton({ title, description, onClick, selected = false }: { title: string; description: string; onClick: () => void; selected?: boolean }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-5 text-left transition hover:border-primary/60 ${selected ? 'border-primary/40 bg-primary/5' : ''}`}><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p><span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Choose <ArrowRight className="ml-1 h-4 w-4"/></span></button>;
}

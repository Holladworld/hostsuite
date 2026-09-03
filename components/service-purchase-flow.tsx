'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Loader2, Mail, Search, Server, Globe, WandSparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Product = { id: string; name: string; description: string | null; product_type: string; billing_mode: string; currency: string; price: number; interval?: string | null; metadata?: Record<string, unknown> };
type ServiceType = 'hosting' | 'domain' | 'email' | 'website';
type ManagementMode = 'self' | 'hostsuite' | 'help';

type Props = { service: ServiceType; managementMode?: ManagementMode };

const copy: Record<ServiceType, { title: string; subtitle: string; icon: typeof Server; needsDomain?: boolean }> = {
  hosting: { title: 'Get your hosting', subtitle: 'Choose a hosting plan, then tell us which domain it should use.', icon: Server, needsDomain: true },
  domain: { title: 'Get your domain', subtitle: 'Search for the address you want. Availability is only confirmed when the domain provider responds.', icon: Globe },
  email: { title: 'Set up business email', subtitle: 'Choose your mailbox plan and tell us which addresses you want.', icon: Mail, needsDomain: true },
  website: { title: 'Start your website', subtitle: 'Choose how you want to build it, then connect a domain when you are ready.', icon: WandSparkles },
};

export function ServicePurchaseFlow({ service, managementMode = 'self' }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [domain, setDomain] = useState('');
  const [domainMode, setDomainMode] = useState<'existing' | 'new'>('existing');
  const [emailAddresses, setEmailAddresses] = useState<string[]>(['']);
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const info = copy[service];
  const Icon = info.icon;

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase.from('billing_products').select('id,name,description,product_type,billing_mode,currency,price,interval,metadata').eq('active', true).eq('product_type', service).order('price');
      if (error) toast.error('We could not load the available plans.');
      setProducts((data as Product[]) ?? []);
    })();
  }, [user, service]);

  const suggestions = useMemo(() => {
    const raw = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!raw) return [];
    return [`${raw}hq.com`, `get${raw}.com`, `${raw}online.ng`];
  }, [query]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }

  async function checkout() {
    if (!selected) return;
    setBusy(true);
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const addresses = emailAddresses.map((v) => v.trim()).filter(Boolean);
    const metadata: Record<string, unknown> = {
      serviceType: service,
      managementMode,
      mode: domainMode,
      domain: cleanDomain || undefined,
      domainSource: domainMode,
      emailAddresses: addresses,
      searchQuery: service === 'domain' ? query.trim() : undefined,
      requestedDomain: service === 'domain' ? cleanDomain : undefined,
    };

    try {
      const response = await fetch('/api/billing/paystack/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [selected.id], metadata: { [selected.id]: metadata }, callbackUrl: `${window.location.origin}/portal/billing` }),
      });
      const result = await response.json() as { authorizationUrl?: string; error?: string; orderId?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? 'Unable to start payment.');
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start payment.');
      setBusy(false);
    }
  }

  function next() {
    if (step === 1 && !selected) return toast.error('Choose a plan first.');
    if (step === 2 && (info.needsDomain && !domain.trim())) return toast.error('Enter the domain you want to use.');
    if (step === 2 && service === 'domain' && !domain.trim()) return toast.error('Enter the domain you want to register.');
    setStep((value) => Math.min(value + 1, 3));
  }

  const managementLabel = managementMode === 'hostsuite' ? 'HostSuite will manage this for you' : managementMode === 'help' ? 'HostSuite will guide you through the setup' : 'You will manage this yourself';

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to service centre</Link>
        <div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">HostSuite {info.title.toLowerCase()}</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{info.title}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{info.subtitle}</p><Badge variant="outline" className="mt-3">{managementLabel}</Badge></div></div>

        <div className="mt-8 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Badge variant={step >= 1 ? 'default' : 'outline'}>1 Plan</Badge><span>→</span><Badge variant={step >= 2 ? 'default' : 'outline'}>2 Configure</Badge><span>→</span><Badge variant={step >= 3 ? 'default' : 'outline'}>3 Review & pay</Badge></div>

        {step === 1 && <section className="mt-6"><Card><CardHeader><CardTitle>Choose your plan</CardTitle><CardDescription>These prices come from the active HostSuite billing catalog.</CardDescription></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2">{products.map((product) => <button key={product.id} type="button" onClick={() => setSelected(product)} className={`rounded-2xl border p-5 text-left transition ${selected?.id === product.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description}</p></div>{selected?.id === product.id && <Check className="h-5 w-5 text-primary" />}</div><p className="mt-5 text-2xl font-bold">{product.currency} {Number(product.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">{product.billing_mode === 'subscription' ? ` / ${product.interval}` : ''}</span></p></button>)}</div>{products.length === 0 && <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No active {service} products are configured yet. Add the product in the HostSuite billing catalog before selling this service.</div>}<Button className="mt-6 gap-2" disabled={!selected} onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button></CardContent></Card></section>}

        {step === 2 && <section className="mt-6 space-y-5"><Card><CardHeader><CardTitle>{service === 'domain' ? 'Find your domain' : 'Connect your domain'}</CardTitle><CardDescription>{service === 'domain' ? 'We never show an unverified domain as available.' : 'Use a domain you already own, or tell us the domain you want to buy.'}</CardDescription></CardHeader><CardContent>{service === 'domain' ? <><div className="flex gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="mybusiness.com"/><Button type="button" variant="outline" onClick={() => { setSearched(true); setDomain(query); }}><Search className="mr-2 h-4 w-4" /> Search</Button></div>{searched && <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><p className="font-medium">Provider availability check is not configured.</p><p className="mt-1 text-muted-foreground">HostSuite will not pretend this domain is available. You can continue with the requested domain and it will be verified during provider registration once the reseller domain API is connected.</p></div>}{suggestions.length > 0 && <div className="mt-5"><p className="text-sm font-medium">Other suggestions</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); setDomain(suggestion); }} className="rounded-full border px-3 py-1.5 text-sm hover:border-primary">{suggestion}</button>)}</div><p className="mt-2 text-xs text-muted-foreground">Suggestions are generated names, not confirmed availability.</p></div>}</> : <><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setDomainMode('existing')} className={`rounded-xl border p-4 text-left ${domainMode === 'existing' ? 'border-primary ring-2 ring-primary/20' : ''}`}><p className="font-semibold">I already have a domain</p><p className="mt-1 text-xs text-muted-foreground">Use an existing domain with this service.</p></button><button type="button" onClick={() => setDomainMode('new')} className={`rounded-xl border p-4 text-left ${domainMode === 'new' ? 'border-primary ring-2 ring-primary/20' : ''}`}><p className="font-semibold">I need a domain</p><p className="mt-1 text-xs text-muted-foreground">I want HostSuite to register one.</p></button></div><div className="mt-4"><label className="text-sm font-medium">Domain name</label><Input className="mt-2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mybusiness.com" /></div></>}</CardContent></Card>
          {service === 'email' && <Card><CardHeader><CardTitle>Which email addresses do you need?</CardTitle><CardDescription>For example, hello@yourbusiness.com or sales@yourbusiness.com.</CardDescription></CardHeader><CardContent><div className="space-y-2">{emailAddresses.map((address, index) => <div key={index} className="flex gap-2"><Input value={address} onChange={(e) => setEmailAddresses((current) => current.map((item, i) => i === index ? e.target.value : item))} placeholder="hello@yourbusiness.com" /></div>)}</div><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setEmailAddresses((current) => [...current, ''])}>Add another address</Button></CardContent></Card>}
          <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={next} className="gap-2">Review <ArrowRight className="h-4 w-4" /></Button></div></section>}

        {step === 3 && selected && <section className="mt-6"><Card><CardHeader><CardTitle>Review your order</CardTitle><CardDescription>We'll keep your setup choice with the order so the service can be handled correctly after payment.</CardDescription></CardHeader><CardContent><div className="space-y-3 rounded-xl border p-4"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Service</span><strong>{selected.name}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Management</span><strong>{managementLabel}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Domain</span><strong>{domain || 'Not specified'}</strong></div>{service === 'email' && <div><span className="text-muted-foreground">Email addresses</span><div className="mt-2 flex flex-wrap gap-2">{emailAddresses.filter(Boolean).map((address) => <Badge key={address} variant="outline">{address}</Badge>)}</div></div>}<div className="flex justify-between gap-4 border-t pt-3"><span className="text-muted-foreground">Total</span><strong>{selected.currency} {Number(selected.price).toLocaleString()}{selected.billing_mode === 'subscription' ? ` / ${selected.interval}` : ''}</strong></div></div><div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Payment is handled by Paystack. HostSuite only treats the verified payment webhook as successful; after payment, your service instance is created and the provider provisioning worker can activate it.</div><div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setStep(2)} disabled={busy}>Back</Button><Button onClick={() => void checkout()} disabled={busy} className="gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay with Paystack</Button></div></CardContent></Card></section>}
      </div>
    </main>
  );
}

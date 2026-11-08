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

type DomainContactState = {
  firstname: string; lastname: string; email: string; phonenumber: string;
  address1: string; address2: string; city: string; state: string; zipcode: string; country: string;
};

const emptyContact: DomainContactState = { firstname: '', lastname: '', email: '', phonenumber: '', address1: '', address2: '', city: '', state: '', zipcode: '', country: 'Nigeria' };
const copy: Record<ServiceType, { title: string; subtitle: string; icon: typeof Server; needsDomain?: boolean }> = {
  hosting: { title: 'Get your hosting', subtitle: 'Choose a hosting plan, then tell us which domain it should use.', icon: Server, needsDomain: true },
  domain: { title: 'Get your domain', subtitle: 'Search for the address you want. Availability is confirmed by the real domain provider.', icon: Globe },
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
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  const [contact, setContact] = useState<DomainContactState>(emptyContact);
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

  async function checkAvailability() {
    const value = query.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!value || !value.includes('.')) return toast.error('Enter a complete domain name, such as mybusiness.com.');
    setSearched(true); setAvailability(null); setAvailabilityError(''); setDomain(value);
    try {
      const response = await fetch(`/api/domains/search?domain=${encodeURIComponent(value)}`, { cache: 'no-store' });
      const result = await response.json() as { available?: boolean; error?: string };
      if (!response.ok || typeof result.available !== 'boolean') throw new Error(result.error ?? 'We could not verify this domain.');
      setAvailability(result.available);
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'We could not verify this domain.');
    }
  }

  async function checkout() {
    if (!selected) return;
    setBusy(true);
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const addresses = emailAddresses.map((v) => v.trim()).filter(Boolean);
    const productMeta = selected.metadata ?? {};
    const planRef = typeof productMeta.providerPlanRef === 'string' ? productMeta.providerPlanRef : typeof productMeta.planRef === 'string' ? productMeta.planRef : typeof productMeta.plan_id === 'string' ? productMeta.plan_id : undefined;
    const metadata: Record<string, unknown> = { serviceType: service, managementMode, mode: domainMode, domain: cleanDomain || undefined, domainSource: domainMode, emailAddresses: addresses, searchQuery: service === 'domain' ? query.trim() : undefined, requestedDomain: service === 'domain' ? cleanDomain : undefined, domainContact: service === 'domain' ? contact : undefined, planRef, providerPlanRef: planRef };

    try {
      const response = await fetch('/api/billing/paystack/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: [selected.id], metadata: { [selected.id]: metadata }, callbackUrl: `${window.location.origin}/portal/billing` }) });
      const result = await response.json() as { authorizationUrl?: string; error?: string; orderId?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? 'Unable to start payment.');
      window.location.assign(result.authorizationUrl);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to start payment.'); setBusy(false); }
  }

  function next() {
    if (step === 1 && !selected) return toast.error('Choose a plan first.');
    if (step === 2 && (info.needsDomain && !domain.trim())) return toast.error('Enter the domain you want to use.');
    if (step === 2 && service === 'domain') {
      if (!domain.trim()) return toast.error('Search for the domain you want to register.');
      if (availability !== true) return toast.error(availability === false ? 'Choose an available domain.' : 'Verify domain availability first.');
      const missing = Object.entries(contact).some(([key, value]) => key !== 'address2' && !value.trim());
      if (missing) return toast.error('Complete the domain registrant details.');
    }
    setStep((value) => Math.min(value + 1, 3));
  }

  const managementLabel = managementMode === 'hostsuite' ? 'HostSuite will manage this for you' : managementMode === 'help' ? 'HostSuite will guide you through the setup' : 'You will manage this yourself';
  const contactInput = (key: keyof DomainContactState, placeholder: string) => <Input value={contact[key]} onChange={(e) => setContact((current) => ({ ...current, [key]: e.target.value }))} placeholder={placeholder} />;

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to service centre</Link>
    <div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">HostSuite {info.title.toLowerCase()}</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{info.title}</h1><p className="mt-2 max-w-2xl text-muted-foreground">{info.subtitle}</p><Badge variant="outline" className="mt-3">{managementLabel}</Badge></div></div>
    <div className="mt-8 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Badge variant={step >= 1 ? 'default' : 'outline'}>1 Plan</Badge><span>→</span><Badge variant={step >= 2 ? 'default' : 'outline'}>2 Configure</Badge><span>→</span><Badge variant={step >= 3 ? 'default' : 'outline'}>3 Review & pay</Badge></div>
    {step === 1 && <section className="mt-6"><Card><CardHeader><CardTitle>Choose your plan</CardTitle><CardDescription>These prices come from the active HostSuite billing catalog. Provider plan metadata stays attached to the order item.</CardDescription></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2">{products.map((product) => <button key={product.id} type="button" onClick={() => setSelected(product)} className={`rounded-2xl border p-5 text-left transition ${selected?.id === product.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-muted-foreground">{product.description}</p></div>{selected?.id === product.id && <Check className="h-5 w-5 text-primary" />}</div><p className="mt-5 text-2xl font-bold">{product.currency} {Number(product.price).toLocaleString()}<span className="text-sm font-normal text-muted-foreground">{product.billing_mode === 'subscription' ? ` / ${product.interval}` : ''}</span></p></button>)}</div>{products.length === 0 && <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No active {service} products are configured yet. Add the product in the HostSuite billing catalog before selling this service.</div>}<Button className="mt-6 gap-2" disabled={!selected} onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button></CardContent></Card></section>}
    {step === 2 && <section className="mt-6 space-y-5"><Card><CardHeader><CardTitle>{service === 'domain' ? 'Find your domain' : 'Connect your domain'}</CardTitle><CardDescription>{service === 'domain' ? 'Availability comes from the configured WhoGoHost reseller API. We do not mark a domain available without a provider response.' : 'Use a domain you already own, or tell us the domain you want to buy.'}</CardDescription></CardHeader><CardContent>{service === 'domain' ? <><div className="flex gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="mybusiness.com"/><Button type="button" variant="outline" onClick={() => void checkAvailability()} disabled={!query.trim()}><Search className="mr-2 h-4 w-4" /> Check</Button></div>{searched && <div className={`mt-4 rounded-xl border p-4 text-sm ${availability === true ? 'border-emerald-500/30 bg-emerald-500/5' : availability === false ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-muted/30'}`}><p className="font-medium">{availability === true ? `${domain} is available.` : availability === false ? `${domain} is not available.` : 'Availability could not be confirmed.'}</p><p className="mt-1 text-muted-foreground">{availabilityError || 'This result was returned by the configured domain provider.'}</p></div>}{suggestions.length > 0 && <div className="mt-5"><p className="text-sm font-medium">Other suggestions</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuery(suggestion); setDomain(suggestion); setAvailability(null); setSearched(false); }} className="rounded-full border px-3 py-1.5 text-sm hover:border-primary">{suggestion}</button>)}</div><p className="mt-2 text-xs text-muted-foreground">Suggestions are generated names. Check each one before selecting it.</p></div>}</> : <><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setDomainMode('existing')} className={`rounded-xl border p-4 text-left ${domainMode === 'existing' ? 'border-primary ring-2 ring-primary/20' : ''}`}><p className="font-semibold">I already have a domain</p><p className="mt-1 text-xs text-muted-foreground">Use an existing domain with this service.</p></button><button type="button" onClick={() => setDomainMode('new')} className={`rounded-xl border p-4 text-left ${domainMode === 'new' ? 'border-primary ring-2 ring-primary/20' : ''}`}><p className="font-semibold">I need a domain</p><p className="mt-1 text-xs text-muted-foreground">I want HostSuite to register one.</p></button></div><div className="mt-4"><label className="text-sm font-medium">Domain name</label><Input className="mt-2" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mybusiness.com" /></div></>}</CardContent></Card>
      {service === 'domain' && availability === true && <Card><CardHeader><CardTitle>Registrant details</CardTitle><CardDescription>WhoGoHost requires complete contact details for domain registration. These details are sent server-side to the reseller API after verified payment.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{contactInput('firstname', 'First name')}{contactInput('lastname', 'Last name')}{contactInput('email', 'Email address')}{contactInput('phonenumber', 'Phone number')}{contactInput('address1', 'Street address')}{contactInput('address2', 'Address line 2 (optional)')}{contactInput('city', 'City')}{contactInput('state', 'State')}{contactInput('zipcode', 'Postal code')}{contactInput('country', 'Country')}</div></CardContent></Card>}
      {service === 'email' && <Card><CardHeader><CardTitle>Which email addresses do you need?</CardTitle><CardDescription>For example, hello@yourbusiness.com or sales@yourbusiness.com.</CardDescription></CardHeader><CardContent><div className="space-y-2">{emailAddresses.map((address, index) => <Input key={index} value={address} onChange={(e) => setEmailAddresses((current) => current.map((item, i) => i === index ? e.target.value : item))} placeholder="hello@yourbusiness.com" />)}</div><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setEmailAddresses((current) => [...current, ''])}>Add another address</Button></CardContent></Card>}
      <div className="flex gap-3"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={next} className="gap-2">Review <ArrowRight className="h-4 w-4" /></Button></div></section>}
    {step === 3 && selected && <section className="mt-6"><Card><CardHeader><CardTitle>Review your order</CardTitle><CardDescription>Configuration becomes order-item metadata, then a verified payment creates the durable service instance.</CardDescription></CardHeader><CardContent><div className="space-y-3 rounded-xl border p-4"><div className="flex justify-between gap-4"><span className="text-muted-foreground">Service</span><strong>{selected.name}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Management</span><strong>{managementLabel}</strong></div><div className="flex justify-between gap-4"><span className="text-muted-foreground">Domain</span><strong>{domain || 'Not specified'}</strong></div>{service === 'domain' && <div><span className="text-muted-foreground">Availability</span><strong className="ml-2">Verified available</strong></div>}{service === 'email' && <div><span className="text-muted-foreground">Email addresses</span><div className="mt-2 flex flex-wrap gap-2">{emailAddresses.filter(Boolean).map((address) => <Badge key={address} variant="outline">{address}</Badge>)}</div></div>}<div className="flex justify-between gap-4 border-t pt-3"><span className="text-muted-foreground">Total</span><strong>{selected.currency} {Number(selected.price).toLocaleString()}{selected.billing_mode === 'subscription' ? ` / ${selected.interval}` : ''}</strong></div></div><div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Payment is handled by Paystack. The verified webhook marks the order paid, creates the service instance from its order-item metadata, and invokes provisioning. No successful payment is represented as a fake provider resource.</div><div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setStep(2)} disabled={busy}>Back</Button><Button onClick={() => void checkout()} disabled={busy} className="gap-2">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay with Paystack</Button></div></CardContent></Card></section>}
  </div></main>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Mail, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type EmailService = {
  id: string;
  service_name: string;
  status: string;
  provider: string | null;
  provider_status: string | null;
  provider_resource_id: string | null;
  control_panel_url: string | null;
  last_error: string | null;
  configuration: Record<string, unknown> | null;
  created_at: string;
};

type ProviderState = { configured: boolean; capabilities: string[] };

function value(input: unknown, fallback: string) {
  return typeof input === 'string' && input.trim() ? input.trim() : fallback;
}

function mailboxes(configuration: Record<string, unknown> | null) {
  const addresses = configuration?.emailAddresses;
  return Array.isArray(addresses) ? addresses.filter((item): item is string => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
}

export default function BusinessEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<EmailService[]>([]);
  const [provider, setProvider] = useState<ProviderState>({ configured: true, capabilities: [] });
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    setBusy(true);
    const [{ data, error }, capabilityResponse] = await Promise.all([
      supabase.from('service_instances').select('id,service_name,status,provider,provider_status,provider_resource_id,control_panel_url,last_error,configuration,created_at').eq('user_id', user.id).eq('service_type', 'email').order('created_at', { ascending: false }),
      fetch('/api/provider/capabilities').catch(() => null),
    ]);
    if (error) toast.error('Unable to load your business email services.');
    else setServices((data ?? []) as EmailService[]);
    if (capabilityResponse?.ok) {
      const result = await capabilityResponse.json() as { capabilities?: string[] };
      setProvider({ configured: true, capabilities: result.capabilities ?? [] });
    } else setProvider({ configured: false, capabilities: [] });
    setBusy(false);
  }

  useEffect(() => {
    if (!loading && !user) router.replace('/portal');
    else if (user) void load();
  }, [loading, router, user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const mailboxCapability = provider.capabilities.includes('email.mailbox');
  const webmailCapability = provider.capabilities.includes('email.webmail');

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Business Email</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Your business email</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Manage the mailboxes attached to email services you actually purchased through HostSuite.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={busy}><RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />Refresh</Button><Button asChild><Link href="/portal/services"><Plus className="mr-2 h-4 w-4" />Get business email</Link></Button></div></div>

    <Card className="mt-7"><CardContent className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><div><p className="font-semibold">Provider connection</p><p className="mt-1 text-sm text-muted-foreground">{provider.configured ? `${provider.capabilities.filter((cap) => cap.startsWith('email.')).length} email capabilities reported by the active provider.` : 'Live provider credentials are not configured in this environment yet.'}</p></div></CardContent></Card>

    {!services.length && !busy && <Card className="mt-4"><CardContent className="flex flex-col items-center justify-center py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Mail className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-semibold">No business email yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">When you purchase business email, the domain, requested mailboxes and real provisioning state will appear here.</p><Button asChild className="mt-5"><Link href="/portal/services">Choose an email plan</Link></Button></CardContent></Card>}

    <div className="mt-4 space-y-4">{services.map((service) => { const boxes = mailboxes(service.configuration); const domain = value(service.configuration?.domain, 'Domain not specified'); return <Card key={service.id}><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div><div className="min-w-0"><CardTitle className="break-all">{service.service_name}</CardTitle><CardDescription>{domain} · {service.provider || 'Provider pending'}</CardDescription></div></div><Badge variant={service.status === 'active' ? 'default' : 'outline'} className="w-fit capitalize">{service.status.replaceAll('_', ' ')}</Badge></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Info label="Domain" value={domain}/><Info label="Provider status" value={value(service.provider_status, service.status.replaceAll('_', ' '))}/><Info label="Provider resource" value={value(service.provider_resource_id, 'Not provisioned yet')}/></div><div className="mt-4"><p className="text-sm font-medium">Mailboxes</p>{boxes.length ? <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((email) => <div key={email} className="rounded-xl border p-3"><p className="break-all text-sm font-medium">{email}</p><p className="mt-1 text-xs text-muted-foreground">Requested mailbox</p></div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No mailbox addresses are stored with this service.</p>}</div>{service.last_error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Needs attention: </span>{service.last_error}</div>}<div className="mt-4 flex flex-col gap-2 sm:flex-row"><Button asChild variant="outline"><Link href={`/portal/services/${service.id}`}>Manage service</Link></Button><Button disabled={!webmailCapability || !service.control_panel_url} title={!webmailCapability ? 'Requires email.webmail capability' : !service.control_panel_url ? 'Webmail URL is not provisioned yet' : undefined}>{webmailCapability && service.control_panel_url ? <a href={service.control_panel_url} target="_blank" rel="noreferrer" className="inline-flex items-center">Open webmail<ExternalLink className="ml-2 h-4 w-4"/></a> : 'Open webmail'}</Button><Button variant="outline" disabled={!mailboxCapability} title={!mailboxCapability ? 'Requires email.mailbox capability from the active provider' : undefined}>Add mailbox</Button></div></CardContent></Card>; })}</div>

    <p className="mt-6 text-xs text-muted-foreground">HostSuite does not display fake mailbox counts, passwords or provider resources. Mailbox actions become available only when the configured provider exposes the required capability.</p>
  </div></main>;
}

function Info({ label, value: content }: { label: string; value: string }) { return <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-medium capitalize">{content}</p></div>; }

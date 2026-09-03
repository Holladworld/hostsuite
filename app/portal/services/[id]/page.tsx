'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Loader2, Mail, RefreshCw, Server, WandSparkles, Sparkles, CircleCheck, AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Instance = { id: string; service_type: string; service_name: string; status: string; provider: string | null; provider_status: string | null; provider_resource_id: string | null; control_panel_url: string | null; last_error: string | null; configuration: Record<string, unknown> | null; created_at: string; provisioned_at: string | null };
type Capability = string;
const icons = { hosting: Server, domain: Globe, email: Mail, website: WandSparkles, ai_builder: Sparkles } as const;

function text(value: unknown, fallback = 'Not provided') { return typeof value === 'string' && value.trim() ? value : fallback; }
function prettyStatus(status: string) { return status.replaceAll('_', ' '); }
function capabilityFor(type: string) { return type === 'hosting' ? ['hosting.usage', 'hosting.controlPanel'] : type === 'domain' ? ['domain.search', 'domain.dns', 'domain.nameservers'] : type === 'email' ? ['email.mailbox', 'email.webmail', 'email.health'] : ['deployment.deploy', 'deployment.status', 'deployment.domain']; }

export default function ServiceManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user || !id) return;
    const { data, error } = await supabase.from('service_instances').select('*').eq('id', id).eq('user_id', user.id).single();
    if (error) { toast.error('Service not found.'); return; }
    setInstance(data as Instance);
    const response = await fetch('/api/provider/capabilities').catch(() => null);
    if (!response?.ok) { setProviderConfigured(false); setCapabilities([]); return; }
    const result = await response.json() as { capabilities?: Capability[] };
    setCapabilities(result.capabilities ?? []);
    setProviderConfigured(true);
  }
  useEffect(() => { if (!loading && !user) router.replace('/portal'); else if (user) void load(); }, [loading, user, id, router]);

  async function retryProvisioning() {
    if (!instance) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/services/${instance.id}/provision`, { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } });
      const result = await response.json() as { error?: string; status?: string };
      if (!response.ok) throw new Error(result.error ?? 'Provisioning failed.');
      toast.success(result.status === 'active' ? 'Service is active.' : 'Provisioning request submitted.');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to provision service.'); }
    finally { setBusy(false); }
  }

  if (loading || !instance) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const Icon = icons[instance.service_type as keyof typeof icons] ?? Server;
  const config = instance.configuration ?? {};
  const domain = text(config.domain, instance.service_type === 'domain' ? instance.service_name : 'Not specified');
  const plan = text(config.planRef ?? config.plan_id);
  const emails = Array.isArray(config.emailAddresses) ? config.emailAddresses.filter((v): v is string => typeof v === 'string') : [];
  const caps = capabilityFor(instance.service_type);
  const available = caps.filter((cap) => capabilities.includes(cap));
  const managementReady = providerConfigured && available.length > 0;
  const isActive = instance.status === 'active';

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Service centre</Link>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium capitalize text-primary">{instance.service_type}</p><h1 className="truncate font-display text-3xl font-bold tracking-tight">{instance.service_name}</h1><p className="mt-1 text-sm text-muted-foreground">{instance.provider || 'HostSuite service'} · Added {new Date(instance.created_at).toLocaleDateString()}</p></div><Badge className="w-fit capitalize">{prettyStatus(instance.status)}</Badge></div>

    {instance.last_error && <div className="mt-6 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive"/><div><p className="font-semibold">This service needs attention</p><p className="mt-1 text-muted-foreground">{instance.last_error}</p></div></div>}

    <section className="mt-7 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card><CardHeader><CardTitle>Service management</CardTitle><CardDescription>Controls shown here are driven by the service type, saved order configuration and provider capabilities. We do not invent controls for unsupported operations.</CardDescription></CardHeader><CardContent>
        {instance.service_type === 'hosting' && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Info label="Primary domain" value={domain}/><Info label="Hosting plan" value={plan}/><Info label="Provider resource" value={text(instance.provider_resource_id)}/><Info label="Provider status" value={text(instance.provider_status, 'Waiting for provider')}/></div><ActionGrid actions={[{ label: 'Open control panel', href: instance.control_panel_url, enabled: Boolean(instance.control_panel_url), capability: 'hosting.controlPanel' }, { label: 'View usage', enabled: managementReady && capabilities.includes('hosting.usage'), capability: 'hosting.usage' }]} /></div>}
        {instance.service_type === 'domain' && <div className="space-y-5"><Info label="Domain" value={domain}/><div className="grid gap-3 sm:grid-cols-2"><Info label="Provider" value={text(instance.provider)}/><Info label="Registration state" value={text(instance.provider_status, prettyStatus(instance.status))}/></div><ActionGrid actions={[{ label: 'DNS records', enabled: capabilities.includes('domain.dns'), capability: 'domain.dns' }, { label: 'Nameservers', enabled: capabilities.includes('domain.nameservers'), capability: 'domain.nameservers' }, { label: 'Renew domain', enabled: false, capability: 'domain.renew' }]} /></div>}
        {instance.service_type === 'email' && <div className="space-y-5"><Info label="Domain" value={domain}/><div><p className="text-sm font-medium">Mailboxes</p>{emails.length ? <div className="mt-2 flex flex-wrap gap-2">{emails.map((email) => <Badge key={email} variant="outline">{email}</Badge>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No mailbox addresses were stored with this order.</p>}</div><ActionGrid actions={[{ label: 'Open webmail', href: undefined, enabled: false, capability: 'email.webmail' }, { label: 'Manage mailboxes', enabled: capabilities.includes('email.mailbox'), capability: 'email.mailbox' }, { label: 'Email health', enabled: capabilities.includes('email.health'), capability: 'email.health' }]} /></div>}
        {instance.service_type === 'website' && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><Info label="Connected domain" value={domain}/><Info label="Provider" value={text(instance.provider, 'HostSuite')}/><Info label="Deployment state" value={text(instance.provider_status, prettyStatus(instance.status))}/></div><ActionGrid actions={[{ label: 'Open website', enabled: false, capability: 'deployment.status' }, { label: 'Deployment', enabled: capabilities.includes('deployment.deploy'), capability: 'deployment.deploy' }, { label: 'Domain connection', enabled: capabilities.includes('deployment.domain'), capability: 'deployment.domain' }]} /><Button asChild variant="outline" className="mt-2"><Link href="/portal/website-builder"><Sparkles className="mr-2 h-4 w-4"/> Open AI website builder</Link></Button></div>}
      </CardContent></Card>

      <div className="space-y-4"><Card><CardHeader><CardTitle>Connection</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3">{managementReady ? <CircleCheck className="h-5 w-5 text-primary"/> : <AlertTriangle className="h-5 w-5 text-amber-600"/>}<div><p className="font-medium">{managementReady ? 'Provider capabilities available' : 'Provider connection pending'}</p><p className="mt-1 text-xs text-muted-foreground">{providerConfigured ? `${available.length} supported capability${available.length === 1 ? '' : 'ies'} reported.` : 'Live reseller credentials/adapter are not configured in this environment.'}</p></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Provisioning</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Paid orders become service instances. Provisioning then records the real provider resource and state.</p>{['paid','provisioning_failed'].includes(instance.status) && <Button className="mt-4 w-full" variant="outline" onClick={() => void retryProvisioning()} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}{instance.status === 'paid' ? 'Provision service' : 'Retry provisioning'}</Button>}{isActive && <div className="mt-4 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">Provisioned {instance.provisioned_at ? new Date(instance.provisioned_at).toLocaleString() : 'successfully'}.</div>}</CardContent></Card>
        <Card><CardContent className="p-5"><p className="font-semibold">Need us to handle it?</p><p className="mt-1 text-sm text-muted-foreground">Use the support desk for provider actions that are not yet exposed as self-service controls.</p><Button asChild variant="outline" className="mt-4 w-full"><Link href="/portal/support">Ask HostSuite for help</Link></Button></CardContent></Card>
      </div>
    </section>

    <p className="mt-6 text-xs text-muted-foreground">HostSuite keeps the order configuration with this service instance, so the domain, plan and requested email addresses selected during checkout remain available to provisioning and customer management.</p>
  </div></main>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all font-medium">{value}</p></div>; }
function ActionGrid({ actions }: { actions: { label: string; href?: string | null; enabled: boolean; capability: string }[] }) { return <div className="grid gap-2 sm:grid-cols-2">{actions.map((action) => action.href ? <Button key={action.label} asChild><a href={action.href} target="_blank" rel="noreferrer">{action.label}<ExternalLink className="ml-2 h-4 w-4"/></a> : <Button key={action.label} variant="outline" disabled={!action.enabled} title={!action.enabled ? `Requires ${action.capability}` : undefined}>{action.label}</Button>)}</div>; }

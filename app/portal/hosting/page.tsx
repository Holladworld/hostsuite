'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Plus, RefreshCw, Server } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';

type HostingInstance = { id: string; service_name: string; status: string; provider: string | null; provider_status: string | null; provider_resource_id: string | null; control_panel_url: string | null; last_error: string | null; configuration: Record<string, unknown> | null; created_at: string; provisioned_at: string | null };
type CapabilityResponse = { capabilities?: string[]; configured?: boolean };

function value(input: unknown, fallback = 'Not provided') { return typeof input === 'string' && input.trim() ? input : fallback; }
function statusLabel(status: string) { return status.replaceAll('_', ' '); }
function statusClass(status: string) {
  if (status === 'active') return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400';
  if (['paid', 'provisioning', 'pending_setup'].includes(status)) return 'border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400';
  if (['provisioning_failed', 'attention_needed'].includes(status)) return 'border-destructive/20 bg-destructive/5 text-destructive';
  return 'border-border bg-muted/30 text-muted-foreground';
}

export default function HostingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<HostingInstance[]>([]);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [dataError, setDataError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    setRefreshing(true);
    try {
      const [{ data, error }, capabilityResponse] = await Promise.all([
        supabase.from('service_instances').select('id,service_name,status,provider,provider_status,provider_resource_id,control_panel_url,last_error,configuration,created_at,provisioned_at').eq('user_id', user.id).eq('service_type', 'hosting').order('created_at', { ascending: false }),
        fetch('/api/provider/capabilities').catch(() => null),
      ]);
      setDataError(Boolean(error));
      if (!error) setServices((data as HostingInstance[]) ?? []);
      if (capabilityResponse?.ok) {
        const result = await capabilityResponse.json() as CapabilityResponse;
        setCapabilities(result.capabilities ?? []);
        setProviderConfigured(Boolean(result.configured));
      } else {
        setCapabilities([]);
        setProviderConfigured(false);
      }
    } finally { setRefreshing(false); }
  }

  useEffect(() => {
    if (!loading && !user) router.replace('/portal');
    if (user) void load();
  }, [loading, user, router]);

  const activeCount = useMemo(() => services.filter((service) => service.status === 'active').length, [services]);
  const attentionCount = useMemo(() => services.filter((service) => ['paid', 'provisioning', 'provisioning_failed', 'attention_needed'].includes(service.status)).length, [services]);
  const canOpenControlPanel = capabilities.includes('hosting.controlPanel');

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Hosting</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Your hosting workspace</h1><p className="mt-2 max-w-2xl text-muted-foreground">See the hosting accounts connected to your HostSuite account and manage only what the provider actually supports.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</Button><Button asChild><Link href="/portal/services"><Plus className="mr-2 h-4 w-4" /> Get hosting</Link></Button></div></div>

    {dataError && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold">We couldn't load your hosting services.</p><p className="mt-1 text-muted-foreground">Your account has not been changed. HostSuite will not create placeholder hosting records when the service database is unavailable.</p></div></div>}

    {!dataError && <section className="mt-7 grid gap-3 sm:grid-cols-3"><Summary label="Hosting services" value={services.length.toString()} /><Summary label="Active" value={activeCount.toString()} /><Summary label="Needs attention" value={attentionCount.toString()} /></section>}

    {!dataError && services.length === 0 && <Card className="mt-7 border-dashed"><CardHeader><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Server className="h-6 w-6" /></div><CardTitle className="mt-2">No HostSuite hosting service yet</CardTitle><CardDescription>Buy a hosting plan or tell us about an existing hosting account. We won't show a service here until it is actually connected to your account.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-3"><Button asChild><Link href="/portal/services">Choose a hosting plan <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href="/portal/services">I already have hosting</Link></Button></CardContent></Card>}

    {!dataError && services.length > 0 && <section className="mt-7 space-y-4">{services.map((service) => { const config = service.configuration ?? {}; const domain = value(config.domain); const plan = value(config.planRef ?? config.plan_id); const ready = service.status === 'active' && Boolean(service.provider_resource_id); return <Card key={service.id} className="overflow-hidden"><CardContent className="p-0"><div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Server className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold">{service.service_name}</h2><Badge variant="outline" className={`capitalize ${statusClass(service.status)}`}>{statusLabel(service.status)}</Badge></div><div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2"><span>Domain: <strong className="font-medium text-foreground">{domain}</strong></span><span>Plan: <strong className="font-medium text-foreground">{plan}</strong></span><span>Provider: <strong className="font-medium text-foreground">{value(service.provider, 'Not configured')}</strong></span><span>Provider state: <strong className="font-medium text-foreground">{value(service.provider_status, 'Waiting for provider')}</strong></span></div></div></div><div className="flex shrink-0 flex-wrap gap-2">{ready && service.control_panel_url && canOpenControlPanel && <Button asChild><a href={service.control_panel_url} target="_blank" rel="noreferrer">Open control panel</a></Button>}<Button asChild variant="outline"><Link href={`/portal/services/${service.id}`}>Manage service <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>{service.last_error && <div className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 text-sm sm:px-6"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /><div><p className="font-medium text-destructive">Provisioning needs attention</p><p className="mt-1 text-muted-foreground">{service.last_error}</p></div></div></div>}{ready && !service.last_error && <div className="border-t px-5 py-3 text-xs text-muted-foreground sm:px-6"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-primary" /> Connected to a provisioned provider resource{service.provisioned_at ? ` · provisioned ${new Date(service.provisioned_at).toLocaleDateString()}` : ''}.</div>}</CardContent></Card>; })}</section>}

    <Card className="mt-7 bg-muted/20"><CardHeader><CardTitle className="text-base">Provider connection</CardTitle><CardDescription>{providerConfigured ? `The current environment reports ${capabilities.length} provider capabilities.` : 'Live hosting provider credentials are not configured in this environment yet.'}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">HostSuite does not invent hosting usage, control-panel links, account IDs or provider statuses. Those details appear only after a real provider integration supplies them.</CardContent></Card>
  </div></main>;
}

function Summary({ label, value: amount }: { label: string; value: string }) { return <div className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{amount}</p></div>; }

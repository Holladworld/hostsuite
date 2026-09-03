'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Globe, KeyRound, Loader2, Lock, RefreshCw, Server, Unlock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Instance = { id: string; service_name: string; status: string; provider: string | null; provider_status: string | null; configuration: Record<string, unknown> | null; last_error: string | null; created_at: string; };

type DomainData = { nameservers: string[]; eppcode?: string; locked?: boolean; };

function domainFrom(instance: Instance) {
  const value = instance.configuration?.domain;
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : instance.service_name;
}

export default function DomainManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [data, setData] = useState<DomainData>({ nameservers: [] });
  const [draftNameservers, setDraftNameservers] = useState<string[]>(['', '']);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEpp, setShowEpp] = useState(false);

  const loadInstance = useCallback(async () => {
    if (!user || !id) return;
    const { data: row, error } = await supabase.from('service_instances').select('*').eq('id', id).eq('user_id', user.id).eq('service_type', 'domain').single();
    if (error || !row) { toast.error('Domain service not found.'); return; }
    setInstance(row as Instance);
  }, [id, user]);

  const api = useCallback(async (action: 'nameservers' | 'epp' | 'lock', method: 'GET' | 'POST' = 'GET', payload?: object) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    const response = await fetch('/api/domains/manage', {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
      ...(method === 'GET' ? { next: undefined } : { body: JSON.stringify({ serviceId: id, action, ...payload }) }),
    });
    const result = await response.json() as DomainData & { error?: string };
    if (!response.ok) throw new Error(result.error ?? 'Provider request failed.');
    return result;
  }, [id]);

  const loadProviderData = useCallback(async () => {
    if (!instance) return;
    setLoadingData(true);
    try {
      const [nameservers, lock] = await Promise.allSettled([api('nameservers'), api('lock')]);
      const next: DomainData = { nameservers: [] };
      if (nameservers.status === 'fulfilled') next.nameservers = nameservers.value.nameservers ?? [];
      if (lock.status === 'fulfilled') next.locked = lock.value.locked;
      if (next.nameservers.length) setDraftNameservers([...next.nameservers, '', ''].slice(0, 5));
      setData(next);
      if (nameservers.status === 'rejected' && lock.status === 'rejected') toast.error(nameservers.reason instanceof Error ? nameservers.reason.message : 'Unable to reach the domain provider.');
    } finally { setLoadingData(false); }
  }, [api, instance]);

  useEffect(() => { if (!loading && !user) router.replace('/portal'); else if (user) void loadInstance(); }, [loadInstance, loading, router, user]);
  useEffect(() => { if (instance) void loadProviderData(); }, [instance, loadProviderData]);

  async function saveNameservers() {
    const nameservers = draftNameservers.map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (nameservers.length < 2) { toast.error('Enter at least two nameservers.'); return; }
    if (new Set(nameservers).size !== nameservers.length) { toast.error('Nameservers must be unique.'); return; }
    setSaving(true);
    try { const result = await api('nameservers', 'POST', { nameservers }); setData((current) => ({ ...current, nameservers: result.nameservers ?? nameservers })); setDraftNameservers([...(result.nameservers ?? nameservers), '', ''].slice(0, 5)); toast.success('Nameservers updated.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update nameservers.'); }
    finally { setSaving(false); }
  }

  async function toggleLock() {
    if (typeof data.locked !== 'boolean') return;
    setSaving(true);
    try { const result = await api('lock', 'POST', { locked: !data.locked }); setData((current) => ({ ...current, locked: result.locked })); toast.success(result.locked ? 'Registrar lock enabled.' : 'Registrar lock disabled.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update registrar lock.'); }
    finally { setSaving(false); }
  }

  async function revealEpp() {
    if (showEpp) { setShowEpp(false); return; }
    setSaving(true);
    try { const result = await api('epp'); setData((current) => ({ ...current, eppcode: result.eppcode })); setShowEpp(true); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to retrieve EPP code.'); }
    finally { setSaving(false); }
  }

  async function copyEpp() { if (!data.eppcode) return; await navigator.clipboard.writeText(data.eppcode); toast.success('EPP code copied.'); }

  if (loading || !instance) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const domain = domainFrom(instance);

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/portal/domains" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Domains</Link>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-primary">Domain management</p><h1 className="break-all font-display text-3xl font-bold tracking-tight">{domain}</h1><p className="mt-1 text-sm text-muted-foreground">{instance.provider || 'Provider not configured'} · {instance.provider_status || instance.status}</p></div><Badge variant={instance.status === 'active' ? 'default' : 'outline'} className="w-fit capitalize">{instance.status.replaceAll('_', ' ')}</Badge></div>
    {instance.last_error && <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="font-semibold">This domain needs attention</p><p className="mt-1 text-muted-foreground">{instance.last_error}</p></div>}
    <div className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader><CardTitle>Nameservers</CardTitle><CardDescription>These are read from and written to the live domain registrar. Changes can take time to propagate.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-3">{draftNameservers.map((value, index) => <div key={index} className="flex gap-2"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs text-muted-foreground">NS{index + 1}</div><Input value={value} onChange={(event) => setDraftNameservers((current) => current.map((item, i) => i === index ? event.target.value : item))} placeholder="ns1.example.com" disabled={saving} /></div>)}</div><div className="flex flex-wrap gap-2"><Button onClick={() => void saveNameservers()} disabled={saving || loadingData}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Server className="mr-2 h-4 w-4" />}Save nameservers</Button><Button variant="outline" onClick={() => void loadProviderData()} disabled={loadingData || saving}><RefreshCw className={`mr-2 h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />Refresh</Button></div></CardContent></Card>
      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Registrar lock</CardTitle><CardDescription>Locking helps prevent unauthorized domain transfers.</CardDescription></CardHeader><CardContent><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3">{data.locked ? <Lock className="h-5 w-5 text-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}<div><p className="font-medium">{typeof data.locked === 'boolean' ? (data.locked ? 'Locked' : 'Unlocked') : 'Unavailable'}</p><p className="text-xs text-muted-foreground">Live registrar state</p></div></div><Button variant="outline" onClick={() => void toggleLock()} disabled={saving || typeof data.locked !== 'boolean'}>{data.locked ? 'Unlock' : 'Lock'}</Button></div></CardContent></Card>
        <Card><CardHeader><CardTitle>EPP / transfer code</CardTitle><CardDescription>Reveal this only when you need to transfer the domain to another registrar.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => void revealEpp()} disabled={saving}><KeyRound className="mr-2 h-4 w-4" />{showEpp ? 'Hide EPP code' : 'Reveal EPP code'}</Button>{showEpp && data.eppcode && <Button variant="ghost" size="icon" onClick={() => void copyEpp()} aria-label="Copy EPP code"><Copy className="h-4 w-4" /></Button>}</div>{showEpp && data.eppcode && <div className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 font-mono text-sm"><span className="break-all">{data.eppcode}</span><Check className="ml-auto h-4 w-4 shrink-0 text-primary" /></div>}</CardContent></Card>
        <Card><CardContent className="p-5"><p className="font-semibold">Renewal & transfer</p><p className="mt-1 text-sm text-muted-foreground">Renewal and transfer orders will go through HostSuite billing first. We do not trigger paid registrar actions directly from this page.</p><Button variant="outline" className="mt-4 w-full" disabled>Renew domain</Button></CardContent></Card>
      </div>
    </div>
    <p className="mt-6 text-xs text-muted-foreground">Provider controls are live only when the configured reseller adapter supports them. HostSuite will show an honest unavailable state instead of inventing domain data.</p>
  </div></main>;
}

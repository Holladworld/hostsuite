'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Domain = { id: string; service_name: string; status: string; provider: string | null; provider_status: string | null; configuration: Record<string, unknown> | null; };

function domainName(domain: Domain) { const value = domain.configuration?.domain; return typeof value === 'string' && value.trim() ? value.trim() : domain.service_name; }

export default function DomainsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    setBusy(true);
    const { data, error } = await supabase.from('service_instances').select('id,service_name,status,provider,provider_status,configuration').eq('user_id', user.id).eq('service_type', 'domain').order('created_at', { ascending: false });
    if (error) toast.error('Unable to load your domains.');
    else setDomains((data ?? []) as Domain[]);
    setBusy(false);
  }

  useEffect(() => { if (!loading && !user) router.replace('/portal'); else if (user) void load(); }, [loading, router, user]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Domains</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Your domains</h1><p className="mt-2 text-sm text-muted-foreground">Manage domains purchased through HostSuite using live provider controls.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void load()} disabled={busy}><RefreshCw className={`mr-2 h-4 w-4 ${busy ? 'animate-spin' : ''}`} />Refresh</Button><Button asChild><Link href="/portal/services"><Plus className="mr-2 h-4 w-4" />Get a domain</Link></Button></div></div>
    {!domains.length && !busy && <Card className="mt-7"><CardContent className="flex flex-col items-center justify-center py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-semibold">No domains yet</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">When you purchase or transfer a domain through HostSuite, it will appear here with its real registration and management state.</p><Button asChild className="mt-5"><Link href="/portal/services">Find a domain</Link></Button></CardContent></Card>}
    <div className="mt-7 grid gap-4 md:grid-cols-2">{domains.map((domain) => <Card key={domain.id}><CardHeader><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe className="h-5 w-5" /></div><div className="min-w-0"><CardTitle className="break-all">{domainName(domain)}</CardTitle><CardDescription>{domain.provider || 'Provider pending'}</CardDescription></div></div><Badge variant={domain.status === 'active' ? 'default' : 'outline'} className="capitalize">{domain.status.replaceAll('_', ' ')}</Badge></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Registration</p><p className="mt-1 text-sm font-medium capitalize">{(domain.provider_status || domain.status).replaceAll('_', ' ')}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Management</p><p className="mt-1 text-sm font-medium">Live controls when provider is connected</p></div></div><Button asChild className="mt-4 w-full"><Link href={`/portal/domains/${domain.id}`}>Manage domain</Link></Button></CardContent></Card>)}</div>
  </div></main>;
}

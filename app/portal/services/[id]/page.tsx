'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Server, Globe, Mail, WandSparkles } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Instance = { id: string; service_type: string; service_name: string; status: string; provider: string | null; provider_status: string | null; provider_resource_id: string | null; control_panel_url: string | null; last_error: string | null; configuration: Record<string, unknown> | null; created_at: string; provisioned_at: string | null };
const icons = { hosting: Server, domain: Globe, email: Mail, website: WandSparkles } as const;

export default function ServiceManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [instance, setInstance] = useState<Instance | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user || !id) return;
    const { data, error } = await supabase.from('service_instances').select('*').eq('id', id).eq('user_id', user.id).single();
    if (error) toast.error('Service not found.'); else setInstance(data as Instance);
  }
  useEffect(() => { if (!loading && !user) router.replace('/portal'); else if (user) void load(); }, [loading, user, id, router]);

  async function retryProvisioning() {
    if (!user || !instance) return;
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
  const emails = Array.isArray(config.emailAddresses) ? config.emailAddresses as string[] : [];
  const domain = typeof config.domain === 'string' ? config.domain : null;

  return <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Service centre</Link><div className="mt-8 flex items-start gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-sm font-medium text-primary">{instance.service_type}</p><h1 className="font-display text-3xl font-bold tracking-tight">{instance.service_name}</h1><p className="mt-1 text-sm text-muted-foreground">Purchased {new Date(instance.created_at).toLocaleDateString()}</p></div><Badge className="ml-auto">{instance.status.replaceAll('_', ' ')}</Badge></div>
    <Card className="mt-8"><CardHeader><CardTitle>Service overview</CardTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Domain</p><p className="mt-1 font-medium">{domain ?? 'Not specified'}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Provider</p><p className="mt-1 font-medium">{instance.provider ?? 'Not assigned'}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Provider status</p><p className="mt-1 font-medium">{instance.provider_status ?? 'Waiting'}</p></div></div>{emails.length > 0 && <div className="mt-4 rounded-xl border p-4"><p className="text-sm font-medium">Requested email addresses</p><div className="mt-2 flex flex-wrap gap-2">{emails.map((email) => <Badge key={email} variant="outline">{email}</Badge>)}</div></div>}{instance.last_error && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><p className="font-medium">Provisioning needs attention</p><p className="mt-1 text-muted-foreground">{instance.last_error}</p></div>}
      <div className="mt-6 flex flex-wrap gap-3">{instance.control_panel_url && <Button asChild><a href={instance.control_panel_url} target="_blank" rel="noreferrer">Open provider panel <ExternalLink className="ml-2 h-4 w-4" /></a>}{['paid','provisioning_failed'].includes(instance.status) && <Button variant="outline" onClick={() => void retryProvisioning()} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} {instance.status === 'paid' ? 'Provision service' : 'Retry provisioning'}</Button>}</div>
    </CardContent></Card>
    <Card className="mt-5 border-primary/20 bg-primary/5"><CardContent className="p-5 text-sm text-muted-foreground">HostSuite only displays provider resources and control-panel links returned by the real provider integration. Nothing here is a simulated hosting account, mailbox or domain.</CardContent></Card>
  </div></main>;
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, Mail, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type Service = { id: string; service_name: string; status: string; provider: string | null; provider_status: string | null; provider_resource_id: string | null; last_error: string | null; configuration: Record<string, unknown> | null; created_at: string; };

function text(value: unknown, fallback: string) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function getMailboxes(configuration: Record<string, unknown> | null) { const value = configuration?.emailAddresses; return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []; }

export default function EmailManagementPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [newMailbox, setNewMailbox] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user || !id) return;
    setBusy(true);
    const { data, error } = await supabase.from('service_instances').select('id,service_name,status,provider,provider_status,provider_resource_id,last_error,configuration,created_at').eq('id', id).eq('user_id', user.id).eq('service_type', 'email').single();
    if (error) toast.error('Email service not found.'); else setService(data as Service);
    const response = await fetch('/api/provider/capabilities').catch(() => null);
    if (response?.ok) { const result = await response.json() as { capabilities?: string[] }; setCapabilities(result.capabilities ?? []); }
    else setCapabilities([]);
    setBusy(false);
  }

  useEffect(() => { if (!loading && !user) router.replace('/portal'); else if (user) void load(); }, [loading, router, user, id]);

  async function openWebmail() {
    if (!service) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/email/manage', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: service.id, action: 'webmail' }) });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? 'Webmail is not available.');
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to open webmail.'); }
    finally { setBusy(false); }
  }

  async function addMailbox() {
    if (!service || !newMailbox.trim()) return;
    const mailbox = newMailbox.trim().toLowerCase();
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/email/manage', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token ?? ''}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: service.id, action: 'create-mailbox', mailbox }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to create mailbox.');
      toast.success('Mailbox creation requested.');
      setNewMailbox('');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create mailbox.'); }
    finally { setBusy(false); }
  }

  if (loading || !user || !service) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const domain = text(service.configuration?.domain, 'Domain not specified');
  const boxes = getMailboxes(service.configuration);
  const canCreate = capabilities.includes('email.mailbox');
  const canWebmail = capabilities.includes('email.webmail');

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/portal/email" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Business email</Link>
    <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium text-primary">Email workspace</p><h1 className="mt-1 break-all font-display text-3xl font-bold tracking-tight">{service.service_name}</h1><p className="mt-2 text-sm text-muted-foreground">{domain} · {service.provider || 'Provider pending'}</p></div><Badge variant={service.status === 'active' ? 'default' : 'outline'} className="w-fit capitalize">{service.status.replaceAll('_', ' ')}</Badge></div>
    {service.last_error && <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"><strong>This service needs attention.</strong><p className="mt-1 text-muted-foreground">{service.last_error}</p></div>}
    <div className="mt-7 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader><CardTitle>Mailboxes</CardTitle><CardDescription>These are the mailbox addresses saved with your HostSuite order. Provider actions are only enabled when the active provider supports them.</CardDescription></CardHeader><CardContent><div className="space-y-2">{boxes.length ? boxes.map((mailbox) => <div key={mailbox} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="break-all text-sm font-medium">{mailbox}</p><p className="text-xs text-muted-foreground">Mailbox requested on this service</p></div><Mail className="h-4 w-4 shrink-0 text-muted-foreground"/></div>) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No mailbox addresses are stored for this service.</div>}</div><div className="mt-5 rounded-xl border p-4"><p className="text-sm font-semibold">Add a mailbox</p><p className="mt-1 text-xs text-muted-foreground">Enter the mailbox name only, for example <span className="font-medium">hello</span>. HostSuite will attach it to {domain}.</p><div className="mt-3 flex gap-2"><Input value={newMailbox} onChange={(event) => setNewMailbox(event.target.value)} placeholder="hello" disabled={!canCreate || busy}/><Button onClick={() => void addMailbox()} disabled={!canCreate || !newMailbox.trim() || busy}><Plus className="mr-2 h-4 w-4"/>Add</Button></div>{!canCreate && <p className="mt-2 text-xs text-muted-foreground">Mailbox provisioning is not available from the current provider adapter yet.</p>}</div></CardContent></Card>
      <div className="space-y-4"><Card><CardHeader><CardTitle>Access</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={() => void openWebmail()} disabled={!canWebmail || busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ExternalLink className="mr-2 h-4 w-4"/>}Open webmail</Button>{!canWebmail && <p className="mt-3 text-xs text-muted-foreground">Webmail access will appear when the configured provider exposes a real webmail URL.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Service</CardTitle></CardHeader><CardContent className="space-y-3"><Info label="Domain" value={domain}/><Info label="Provider status" value={text(service.provider_status, service.status.replaceAll('_', ' '))}/><Info label="Provider resource" value={text(service.provider_resource_id, 'Not provisioned yet')}/><Button asChild variant="outline" className="w-full"><Link href="/portal/services">Service centre</Link></Button><Button variant="ghost" className="w-full" onClick={() => void load()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/>Refresh service</Button></CardContent></Card><Card><CardContent className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><div><p className="font-semibold">No fake mailbox state</p><p className="mt-1 text-xs text-muted-foreground">HostSuite only shows addresses saved to the service and live provider actions when those capabilities are actually available.</p></div></CardContent></Card></div>
    </div>
  </div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-medium capitalize">{value}</p></div>; }

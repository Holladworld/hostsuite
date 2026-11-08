'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/use-admin';

type Service = { id: string; user_id: string; order_id: string; service_type: string; service_name: string; status: string; configuration: Record<string, unknown> | null; provider: string | null; provider_resource_id: string | null; provider_status: string | null; control_panel_url: string | null; last_error: string | null; created_at: string };

export default function AdminServicesPage() {
  const { isAdmin, loading } = useAdmin();
  const [services, setServices] = useState<Service[]>([]);
  const [busy, setBusy] = useState(false);
  async function load() { setBusy(true); const response = await fetch('/api/admin/service-instances'); const result = await response.json() as { services?: Service[] }; setServices(result.services ?? []); setBusy(false); }
  useEffect(() => { if (isAdmin) void load(); }, [isAdmin]);
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return <div className="flex min-h-screen items-center justify-center">Access denied.</div>;
  return <main className="min-h-screen bg-muted/30 p-4 sm:p-8"><div className="mx-auto max-w-7xl"><Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4"/> Admin dashboard</Link><div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Service operations</p><h1 className="font-display text-3xl font-bold">Customer services</h1><p className="mt-1 text-sm text-muted-foreground">Orders, configuration and real provider state. No fake resources are shown.</p></div><Button variant="outline" onClick={() => void load()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/> Refresh</Button></div><div className="mt-6 overflow-hidden rounded-2xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="p-4">Service</th><th className="p-4">Customer</th><th className="p-4">Status</th><th className="p-4">Provider</th><th className="p-4">Configuration</th><th className="p-4">Resource</th></tr></thead><tbody>{services.map((service) => <tr key={service.id} className="border-b last:border-0"><td className="p-4"><div className="flex items-center gap-2"><Server className="h-4 w-4 text-primary"/><div><p className="font-medium">{service.service_name}</p><p className="text-xs text-muted-foreground">{service.service_type}</p></div></div></td><td className="p-4 font-mono text-xs">{service.user_id}</td><td className="p-4"><Badge variant={service.status === 'active' ? 'default' : 'outline'}>{service.status.replaceAll('_', ' ')}</Badge></td><td className="p-4">{service.provider ?? '—'}<p className="text-xs text-muted-foreground">{service.provider_status ?? '—'}</p></td><td className="max-w-sm p-4"><pre className="max-h-24 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(service.configuration ?? {}, null, 2)}</pre></td><td className="p-4 text-xs">{service.provider_resource_id ?? 'Not provisioned'}{service.control_panel_url && <a className="ml-2 text-primary underline" href={service.control_panel_url} target="_blank" rel="noreferrer">Panel</a>}{service.last_error && <p className="mt-1 text-destructive">{service.last_error}</p>}</td></tr>)}{services.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No purchased service instances yet.</td></tr>}</tbody></table></div></div></div></main>;
}

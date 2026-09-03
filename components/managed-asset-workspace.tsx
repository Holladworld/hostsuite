'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, Loader2, Mail, Server, WandSparkles } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, useAuth } from '@/lib/supabase-client';

type ServiceType = 'hosting' | 'domain' | 'email' | 'website';
type ManagedAsset = { id: string; service_type: ServiceType; name: string; identifier: string; provider_name: string | null; management_mode: string; status: string; details?: Record<string, unknown> };

const icons: Record<ServiceType, typeof Server> = { hosting: Server, domain: Globe, email: Mail, website: WandSparkles };

function managementLabel(mode: string) {
  if (mode === 'hostsuite') return 'HostSuite manages it';
  if (mode === 'self') return 'You manage it';
  return 'Guided setup';
}

function statusLabel(status: string) { return status.replaceAll('_', ' '); }

export function ManagedAssetWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [asset, setAsset] = useState<ManagedAsset | null>(null);
  const [loadingAsset, setLoadingAsset] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const headers = data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
      try {
        const response = await fetch('/api/managed-assets', { headers });
        if (!response.ok) throw new Error('Unable to load service.');
        const result = await response.json() as { assets?: ManagedAsset[] };
        setAsset(result.assets?.find((item) => item.id === id) ?? null);
      } catch {
        setAsset(null);
      } finally {
        setLoadingAsset(false);
      }
    })();
  }, [user, id]);

  if (loading || loadingAsset) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  if (!user) { router.replace('/portal'); return null; }
  if (!asset) return <main className="min-h-screen bg-background px-4 py-10"><div className="mx-auto max-w-3xl"><Link href="/portal/services" className="text-sm text-muted-foreground">← Back to services</Link><Card className="mt-8"><CardHeader><CardTitle>Service not found</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">We couldn't find this service in your HostSuite workspace.</p><Button asChild className="mt-4"><Link href="/portal/services">Back to services</Link></Button></CardContent></Card></div></main>;

  const Icon = icons[asset.service_type];
  const isPending = asset.status === 'pending_setup';

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/portal/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Back to services</Link>
    <div className="mt-8 flex items-start gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><div className="min-w-0"><p className="text-sm font-medium text-primary">Existing {asset.service_type}</p><h1 className="mt-1 truncate font-display text-3xl font-bold tracking-tight">{asset.name}</h1><p className="mt-2 text-muted-foreground">{asset.provider_name || 'Provider not specified'} · {managementLabel(asset.management_mode)}</p></div></div>

    <div className="mt-8 grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className="mt-2 capitalize">{statusLabel(asset.status)}</Badge></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Provider</p><p className="mt-2 font-medium">{asset.provider_name || 'Not specified'}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Management</p><p className="mt-2 font-medium">{managementLabel(asset.management_mode)}</p></CardContent></Card></div>

    <Card className="mt-6"><CardHeader><CardTitle>{isPending ? "Let's get it connected" : 'Your service'}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{asset.management_mode === 'hostsuite' ? 'This service is marked for HostSuite management. We have recorded what you already have, but we have not invented a provider connection or access credentials. The next management step will connect the real service.' : asset.management_mode === 'self' ? 'This service is recorded in your HostSuite workspace. HostSuite will only show self-management controls when a real provider connection or supported tool is available.' : 'This service is recorded in your HostSuite workspace so we can help you work out the right next step.'}</p><div className="mt-5 rounded-xl border bg-muted/20 p-4"><p className="text-sm font-medium">Service identifier</p><p className="mt-1 break-all text-sm text-muted-foreground">{asset.identifier}</p></div></CardContent></Card>

    <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><ExternalLink className="h-3.5 w-3.5"/> Existing services remain with their current provider unless you choose otherwise.</p>
  </div></main>;
}

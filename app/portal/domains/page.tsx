'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Loader2, Mail, RefreshCw, Server, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, useAuth } from '@/lib/supabase-client';
import type { DomainRow } from '@/lib/types';
import { toast } from 'sonner';

function statusLabel(status: DomainRow['status']) {
  switch (status) {
    case 'backup_complete':
      return 'Backup complete';
    case 'security_clean':
      return 'Security clean';
    case 'maintenance':
      return 'Maintenance';
    case 'expiring':
      return 'Needs attention';
    default:
      return 'Active';
  }
}

function statusIsAttention(status: DomainRow['status']) {
  return status === 'expiring' || status === 'maintenance';
}

export default function DomainsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadDomains = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const { data, error } = await supabase
      .from('domains')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('We could not load your domains.');
      setDomains([]);
    } else {
      setDomains((data as DomainRow[]) ?? []);
    }
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/portal');
      return;
    }
    if (user) void loadDomains();
  }, [loading, user, router, loadDomains]);

  if (loading || (!user && loadingData)) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to portal
          </Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Domains</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Your domains</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review the domains connected to your HostSuite account. Registration, renewal and provider-connected DNS actions will be added when the domain provider integration is available.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/get-started">Get a domain <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Connected</p><p className="mt-1 font-display text-2xl font-bold">{domains.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">SSL active</p><p className="mt-1 font-display text-2xl font-bold">{domains.filter((domain) => domain.ssl_active).length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Needs attention</p><p className="mt-1 font-display text-2xl font-bold">{domains.filter((domain) => statusIsAttention(domain.status)).length}</p></CardContent></Card>
        </section>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div><h2 className="font-display text-xl font-semibold">Connected domains</h2><p className="mt-1 text-sm text-muted-foreground">Information currently available from your HostSuite account.</p></div>
          <Button variant="outline" size="sm" onClick={() => void loadDomains()} disabled={loadingData} className="gap-2"><RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} /> Refresh</Button>
        </div>

        {domains.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Globe className="h-6 w-6" /></div>
              <h2 className="mt-4 font-display text-lg font-semibold">No domain connected yet</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">You can connect an existing domain or start the HostSuite setup flow if you need a domain for your business.</p>
              <Button asChild className="mt-5 gap-2"><Link href="/get-started">Get started <ArrowRight className="h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 space-y-4">
            {domains.map((domain) => {
              const attention = statusIsAttention(domain.status);
              return (
                <Card key={domain.id}>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe className="h-5 w-5" /></div>
                        <div className="min-w-0"><CardTitle className="truncate text-lg">{domain.domain}</CardTitle><CardDescription className="mt-1">{domain.plan_tier.replace('_', ' ')} plan</CardDescription></div>
                      </div>
                      <Badge variant={attention ? 'destructive' : 'outline'}>{attention ? <TriangleAlert className="mr-1 h-3 w-3" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}{statusLabel(domain.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> SSL</div><p className="mt-2 text-sm font-medium">{domain.ssl_active ? 'Active' : 'Not active'}</p></div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Server className="h-4 w-4" /> Uptime</div><p className="mt-2 text-sm font-medium">{domain.uptime_pct}%</p></div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4" /> Last backup</div><p className="mt-2 text-sm font-medium">{domain.last_backup ? new Date(domain.last_backup).toLocaleDateString() : 'Not available'}</p></div>
                      <div className="rounded-xl border border-border bg-muted/30 p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-4 w-4" /> DNS / Email</div><p className="mt-2 text-sm font-medium">Managed separately</p></div>
                    </div>

                    <div className="mt-4 rounded-xl border border-border p-4">
                      <p className="text-sm font-medium">Domain actions</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">Provider-connected registration, renewal and DNS changes are not available in this milestone. Nothing on this page will claim that an external domain action has been completed.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm"><Link href="/get-started">Get another service</Link></Button>
                        <Button asChild variant="ghost" size="sm"><Link href="/portal/dashboard">Back to portal</Link></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div><p className="font-semibold">Need help with your domain?</p><p className="mt-1 text-sm text-muted-foreground">Use the existing HostSuite support path if you need technical assistance.</p></div>
            <Button asChild variant="outline"><Link href="/get-started">Get help</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

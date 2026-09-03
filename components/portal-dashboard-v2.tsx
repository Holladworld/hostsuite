'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, CheckCircle2, CircleHelp, Globe, HardDrive, Loader2, LogOut, Mail, MessageCircle, RefreshCw, Server, Ticket, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, useAuth } from '@/lib/supabase-client';
import { waLink } from '@/lib/constants';
import type { DomainRow, TicketRow } from '@/lib/types';
import { toast } from 'sonner';

const serviceCards = [
  { key: 'website', label: 'Websites', description: 'Build, connect or manage your website.', icon: Globe, manage: '/portal/websites', buy: '/portal/website-builder' },
  { key: 'domain', label: 'Domains', description: 'Manage your domain and DNS.', icon: Globe, manage: '/portal/domains', buy: '/portal/services/domain' },
  { key: 'hosting', label: 'Hosting', description: 'Manage the hosting behind your website.', icon: Server, manage: '/portal/hosting', buy: '/portal/services/hosting' },
  { key: 'email', label: 'Business Email', description: 'Create and manage professional email.', icon: Mail, manage: '/portal/email', buy: '/portal/services/email' },
  { key: 'backup', label: 'Backups', description: 'Protect your website data.', icon: HardDrive, manage: '/portal/backups', buy: '/portal/services' },
  { key: 'monitoring', label: 'Monitoring', description: 'Check supported services for problems.', icon: Activity, manage: '/portal/monitoring', buy: '/portal/services' },
] as const;

export function PortalDashboardV2() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    const [domainsResult, ticketsResult] = await Promise.all([
      supabase.from('domains').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (domainsResult.error) toast.error('We could not load your domains.');
    if (ticketsResult.error) toast.error('We could not load your support requests.');
    setDomains((domainsResult.data as DomainRow[]) ?? []);
    setTickets((ticketsResult.data as TicketRow[]) ?? []);
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/portal');
      return;
    }
    if (user) void loadData();
  }, [loading, user, loadData, router]);

  const openTickets = useMemo(() => tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length, [tickets]);
  const sslCount = domains.filter((domain) => domain.ssl_active).length;
  const hasAttention = domains.some((domain) => domain.status === 'expiring');

  async function handleSignOut() {
    await signOut();
    router.push('/portal');
  }

  if (loading || (!user && loadingData)) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Server className="h-5 w-5" /></div><div className="leading-none"><span className="block font-display text-lg font-bold tracking-tight">HostSuite</span><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Portal</span></div></Link><div className="flex items-center gap-3"><span className="hidden max-w-[240px] truncate text-sm text-muted-foreground sm:block">{user.email}</span><Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5"><LogOut className="h-4 w-4" /> Sign out</Button></div></div></header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-sm font-medium text-primary">Your HostSuite workspace</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything your business needs online.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Manage an existing service, buy something new, or ask a person to help.</p></div><Button asChild className="gap-2"><Link href="/portal/services">Buy a service <ArrowRight className="h-4 w-4" /></Link></Button></div></section>

        <section className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${hasAttention ? 'bg-destructive/10 text-destructive' : domains.length ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{hasAttention ? <TriangleAlert className="h-5 w-5" /> : domains.length ? <CheckCircle2 className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}</div><div><h2 className="font-semibold">{domains.length ? (hasAttention ? 'One or more domains need attention.' : 'Your connected domains look healthy.') : 'Your workspace is ready.'}</h2><p className="text-sm text-muted-foreground">{domains.length ? `${domains.length} domain${domains.length === 1 ? '' : 's'} connected · ${sslCount} with SSL active · ${openTickets} open support request${openTickets === 1 ? '' : 's'}.` : 'Use the service cards below to manage existing services or start a new one.'}</p></div></div><Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loadingData} className="gap-2"><RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} /> Refresh</Button></div>{hasAttention && <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><p className="font-medium">A domain needs attention.</p><p className="mt-1 text-muted-foreground">Review the domain or ask HostSuite for help.</p></div>}</section>

        <section className="mt-8"><div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Your services</h2><p className="mt-1 text-sm text-muted-foreground">Manage what you already have or start a new service directly.</p></div><Link href="/portal/services" className="text-sm font-medium text-primary hover:underline">View all</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{serviceCards.map(({ key, label, description, icon: Icon, manage, buy }) => <div key={key} className="rounded-2xl border border-border bg-card p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="mt-4 font-semibold">{label}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm"><Link href={manage}>Manage</Link></Button><Button asChild size="sm" variant="outline"><Link href={buy}>Buy / set up</Link></Button><Button asChild size="sm" variant="ghost"><a href={waLink(`Hello HostSuite, I need help with ${label.toLowerCase()}.`)} target="_blank" rel="noopener noreferrer">Ask us</a></Button></div></div>)}</div></section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Connected domains</h2><p className="mt-1 text-sm text-muted-foreground">Domains currently connected to your account.</p></div><Globe className="h-5 w-5 text-muted-foreground" /></div><div className="mt-5 space-y-3">{domains.slice(0, 4).map((domain) => <div key={domain.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{domain.domain}</p><p className="mt-0.5 text-xs text-muted-foreground">{domain.ssl_active ? 'SSL active' : 'SSL not active'}</p></div><Badge variant="outline">{domain.status.replace('_', ' ')}</Badge></div>)}{!domains.length && <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">No domains are connected yet.</p>}</div><Button asChild variant="outline" className="mt-4"><Link href="/portal/domains">Manage domains</Link></Button></div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Support</h2><p className="mt-1 text-sm text-muted-foreground">Talk to HostSuite when you need a human.</p></div><Ticket className="h-5 w-5 text-muted-foreground" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Button asChild className="h-auto justify-start gap-3 p-4 text-left"><a href={waLink('Hello HostSuite, I need technical help.')} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-5 w-5" /><span><strong className="block">Ask HostSuite</strong><span className="text-xs font-normal opacity-80">Get help with a technical problem.</span></span></a></Button><Button asChild variant="outline" className="h-auto justify-start gap-3 p-4 text-left"><Link href="/portal/support"><Ticket className="h-5 w-5" /><span><strong className="block">Support requests</strong><span className="text-xs font-normal text-muted-foreground">View or raise a request.</span></span></Link></Button></div><div className="mt-4 rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Open support requests</span><span className="font-mono-data text-lg font-bold">{openTickets}</span></div>{tickets[0] && <p className="mt-2 truncate text-xs text-muted-foreground">Latest: {tickets[0].subject}</p>}</div></div></section>
      </main>
    </div>
  );
}

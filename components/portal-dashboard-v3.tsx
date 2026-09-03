'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, Globe, Mail, Server, WandSparkles, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';

type Instance = { id: string; service_type: string; service_name: string; status: string; configuration: Record<string, unknown> | null; provider_status: string | null };
const cards = [
  { type: 'hosting', label: 'Hosting', description: 'Buy or manage your hosting.', href: '/portal/hosting', icon: Server },
  { type: 'domain', label: 'Domains', description: 'Register or manage domains.', href: '/portal/domains', icon: Globe },
  { type: 'email', label: 'Business Email', description: 'Buy or manage mailboxes.', href: '/portal/email', icon: Mail },
  { type: 'website', label: 'Websites', description: 'Start or manage your website.', href: '/portal/websites', icon: WandSparkles },
];

export function PortalDashboardV3() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  useEffect(() => { if (!user) return; void supabase.from('service_instances').select('id,service_type,service_name,status,configuration,provider_status').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setInstances((data as Instance[]) ?? [])); }, [user]);
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) { router.replace('/portal'); return null; }
  const active = instances.filter((item) => item.status === 'active');
  const pending = instances.filter((item) => ['paid', 'provisioning', 'provisioning_failed'].includes(item.status));
  return <div className="min-h-screen bg-background"><header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="font-display text-lg font-bold">HostSuite <span className="text-xs font-normal text-muted-foreground">Client Portal</span></Link><div className="flex items-center gap-3"><span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span><Button size="sm" variant="outline" onClick={async () => { await signOut(); router.push('/portal'); }}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button></div></div></header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Your workspace</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">What do you want to work on?</h1><p className="mt-2 text-muted-foreground">Buy a new service, or open something you already own. You no longer need to return to the marketing landing page.</p></div><Button asChild className="gap-2"><Link href="/portal/services">Service centre <ArrowRight className="h-4 w-4" /></Link></Button></div>
      <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Purchased services</p><p className="mt-1 text-2xl font-bold">{instances.length}</p></div><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Active</p><p className="mt-1 text-2xl font-bold">{active.length}</p></div><div className="rounded-2xl border bg-card p-5"><p className="text-xs text-muted-foreground">Provisioning / attention</p><p className="mt-1 text-2xl font-bold">{pending.length}</p></div></div>
      <section className="mt-8"><h2 className="font-display text-xl font-semibold">Your services</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{cards.map(({ type, label, description, href, icon: Icon }) => { const mine = instances.filter((item) => item.service_type === type); return <Card key={type} label={label} description={description} href={href} icon={Icon} instances={mine} />; })}</div></section>
      <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-primary"/><div><p className="font-semibold">Service status</p><p className="mt-1 text-sm text-muted-foreground">Purchased services move from payment to provisioning to active. Open any service to see its actual provider state.</p></div></div></section>
    </main></div>;
}

function Card({ label, description, href, icon: Icon, instances }: { label: string; description: string; href: string; icon: typeof Server; instances: Instance[] }) {
  return <div className="rounded-2xl border bg-card p-5"><div className="flex items-start justify-between gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5"/></div><Badge variant="outline">{instances.length ? `${instances.length} purchased` : 'New'}</Badge></div><h3 className="mt-4 font-semibold">{label}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p>{instances.length > 0 && <div className="mt-4 space-y-2">{instances.slice(0, 2).map((item) => <Link key={item.id} href={`/portal/services/${item.id}`} className="flex items-center justify-between rounded-xl border p-3 hover:border-primary/40"><span className="min-w-0 truncate text-sm font-medium">{item.service_name}</span><Badge variant="outline" className="ml-2">{item.status.replaceAll('_', ' ')}</Badge></Link>)}</div>}<Button asChild variant={instances.length ? 'outline' : 'default'} className="mt-4 w-full gap-2"><Link href={instances.length ? `/portal/services/${instances[0].id}` : href}>{instances.length ? `Manage ${label.toLowerCase()}` : `Get ${label.toLowerCase()}`} <ArrowRight className="h-4 w-4"/></Link></Button></div>;
}

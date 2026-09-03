'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleHelp, ExternalLink, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';

export default function HostingPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Hosting</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Manage Hosting</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your hosting workspace will show the actual provider-backed account, package, usage and control-panel actions once a hosting resource exists for this account.</p></div><Button asChild className="gap-2"><Link href="/portal/services/hosting">Get hosting <ArrowRight className="h-4 w-4" /></Link></Button></div>

        <Card className="mt-8"><CardContent className="flex flex-col items-center px-6 py-14 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Server className="h-7 w-7" /></div><h2 className="mt-5 font-display text-xl font-semibold">No hosting account connected yet</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">There is no hosting account that HostSuite can safely claim is active for this customer yet. Once provisioning is connected to the selected provider, this page becomes the operational control panel for that account.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button asChild><Link href="/portal/services/hosting">Start hosting setup</Link></Button><Button asChild variant="outline"><Link href="/portal/support">Ask HostSuite</Link></Button></div></CardContent></Card>

        <div className="mt-6 grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Provider account details, package and lifecycle status will appear here.</p></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Usage</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Disk, bandwidth and other provider-supported usage metrics will be shown here.</p></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Control panel</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">HostSuite will expose a provider-generated control-panel link only when the provider returns one.</p></CardContent></Card></div>

        <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Need a hosting change?</p><p className="mt-1 text-sm text-muted-foreground">Ask HostSuite to handle technical work instead of changing infrastructure blindly.</p></div></div><Button asChild variant="outline" className="gap-2"><Link href="/portal/support">Request help <ExternalLink className="h-4 w-4" /></Link></Button></CardContent></Card>
      </main>
    </div>
  );
}

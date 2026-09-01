'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Globe, HardDrive, Loader2, MonitorCheck, ShieldCheck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/supabase-client';
import { getWebsiteHealthLabel, type WebsiteProject } from '@/lib/website-management';

const exampleWebsite: WebsiteProject = {
  id: 'builder-preview',
  name: 'Your website project',
  status: 'unknown',
  sslActive: false,
  backupAvailable: false,
  monitoringEnabled: false,
};

export default function WebsitesPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const website = exampleWebsite;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Websites</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Manage your website</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">One simple place to see your website status, infrastructure and the next action you can take.</p></div><Button asChild className="gap-2"><Link href="/portal/website-builder">Build a website <ArrowRight className="h-4 w-4" /></Link></Button></div>

        <Card className="mt-8"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{website.name}</CardTitle><CardDescription className="mt-1">{website.domain || 'No domain connected yet'}</CardDescription></div><div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium"><MonitorCheck className="h-3.5 w-3.5" />{getWebsiteHealthLabel(website.status)}</div></div></CardHeader><CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl border border-border bg-muted/30 p-4"><Globe className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Website</p><p className="mt-1 text-sm font-medium">Not published</p></div><div className="rounded-xl border border-border bg-muted/30 p-4"><ShieldCheck className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">SSL</p><p className="mt-1 text-sm font-medium">{website.sslActive ? 'Active' : 'Not configured'}</p></div><div className="rounded-xl border border-border bg-muted/30 p-4"><HardDrive className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Backup</p><p className="mt-1 text-sm font-medium">{website.backupAvailable ? 'Available' : 'Not configured'}</p></div><div className="rounded-xl border border-border bg-muted/30 p-4"><MonitorCheck className="h-4 w-4 text-primary" /><p className="mt-3 text-xs text-muted-foreground">Monitoring</p><p className="mt-1 text-sm font-medium">{website.monitoringEnabled ? 'Enabled' : 'Not enabled'}</p></div></div>

          <div className="mt-6"><p className="text-sm font-semibold">Website actions</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Button asChild variant="outline" className="justify-start gap-2"><Link href="/portal/website-builder"><Wrench className="h-4 w-4" /> Edit website</Link></Button><Button asChild variant="outline" className="justify-start gap-2"><Link href="/portal/domains"><Globe className="h-4 w-4" /> Connect domain</Link></Button><Button asChild variant="outline" className="justify-start gap-2"><Link href="/portal/hosting"><HardDrive className="h-4 w-4" /> Manage hosting</Link></Button><Button asChild variant="outline" className="justify-start gap-2"><Link href="/get-started"><MonitorCheck className="h-4 w-4" /> Check health</Link></Button></div></div>
        </CardContent></Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-3"><Card><CardHeader><CardTitle className="text-base">Your website, your infrastructure</CardTitle><CardDescription>HostSuite is designed to manage the experience without forcing every customer website onto the HostSuite application server.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">When deployment integrations are ready, you can choose HostSuite-managed hosting, keep existing hosting, or use infrastructure you control.</p></CardContent></Card><Card><CardHeader><CardTitle className="text-base">SSL & backups</CardTitle><CardDescription>Important infrastructure controls stay visible.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Actual certificates, backup jobs and restores will be connected to the selected infrastructure provider rather than simulated here.</p></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Need a change?</CardTitle><CardDescription>You won't have to figure out the technical details.</CardDescription></CardHeader><CardContent><Button asChild variant="outline" className="gap-2"><Link href="/get-started">Request help <ExternalLink className="h-4 w-4" /></Link></Button></CardContent></Card></div>

        <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Not published yet</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Build a draft first. Publishing will only happen after a real deployment target and provider connection are configured.</p></div><Button asChild className="gap-2"><Link href="/portal/website-builder">Continue building <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
      </main>
    </div>
  );
}

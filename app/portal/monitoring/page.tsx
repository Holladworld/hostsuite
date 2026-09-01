'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, Globe2, Mail, ShieldCheck, Activity, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MONITOR_CHECKS } from '@/lib/monitoring';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div><p className="text-sm font-medium text-primary">Monitoring</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Know when something needs attention</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">HostSuite will eventually check your website, domain, SSL, email and backups so you do not have to.</p></div>

        <Card className="mt-8 border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Monitoring is being prepared</p><p className="mt-1 text-sm leading-6 text-muted-foreground">The customer experience is ready, but no real checks are reported yet. This prevents the dashboard from claiming a website is healthy when no monitoring worker has actually checked it.</p></div></div><Button asChild variant="outline"><Link href="/portal/websites">View websites</Link></Button></CardContent></Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{MONITOR_CHECKS.map((check) => { const icons = { uptime: Activity, ssl: ShieldCheck, dns: Globe2, response_time: Clock3, website: Globe2, email: Mail, backup: HardDrive }; const Icon = icons[check.type]; return <Card key={check.type}><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm font-semibold">{check.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Not checked yet</p></CardContent></Card>; })}</div>

        <Card className="mt-6"><CardHeader><CardTitle>How HostSuite monitoring will work</CardTitle><CardDescription>Checks should happen outside the normal customer web request.</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-4"><div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">1. Check</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A worker or monitoring provider checks the configured target.</p></div><div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">2. Verify</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Transient failures are verified before an incident is raised.</p></div><div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">3. Notify</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The customer can be notified when a real issue is confirmed.</p></div><div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">4. Escalate</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Serious issues can feed the support and emergency desk.</p></div></div></CardContent></Card>
      </main>
    </div>
  );
}

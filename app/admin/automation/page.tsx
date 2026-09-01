'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, CheckCircle2, Clock3, PlayCircle, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_AUTOMATION_RULES, type AutomationRule } from '@/lib/automation';

function actionLabel(action: AutomationRule['actions'][number]) {
  return action.replaceAll('_', ' ');
}

export default function AdminAutomationPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Link></div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div><p className="text-sm font-medium text-primary">Automation</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Let HostSuite handle routine work</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Events can trigger verification, customer notifications, incidents and support tasks so you only step in when automation cannot safely resolve an issue.</p></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><Zap className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Detect</p><p className="mt-1 text-sm text-muted-foreground">Receive an event from monitoring, billing or a scheduled job.</p></CardContent></Card><Card><CardContent className="p-5"><ShieldCheck className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Verify</p><p className="mt-1 text-sm text-muted-foreground">Confirm the problem before customer-impacting actions.</p></CardContent></Card><Card><CardContent className="p-5"><Bell className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">Respond</p><p className="mt-1 text-sm text-muted-foreground">Notify, remediate when safe, or escalate to you.</p></CardContent></Card></div>
        <Card className="mt-8"><CardHeader><CardTitle>Automation rules</CardTitle><CardDescription>These are the intended rules for HostSuite's automation layer. Execution is not simulated.</CardDescription></CardHeader><CardContent className="space-y-3">{DEFAULT_AUTOMATION_RULES.map((rule) => <div key={rule.id} className="rounded-xl border border-border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="font-medium">{rule.name}</p></div><p className="mt-1 text-xs text-muted-foreground">Event: {rule.event.replaceAll('_', ' ')}</p></div><span className="inline-flex w-fit items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs"><PlayCircle className="h-3.5 w-3.5" /> Enabled</span></div><div className="mt-3 flex flex-wrap gap-2">{rule.actions.map((action) => <span key={action} className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">{actionLabel(action)}</span>)}</div></div>)}</CardContent></Card>
        <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Execution boundary</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Scheduled jobs and provider mutations will run server-side through authenticated workers/adapters. The browser cannot execute domain renewals, change DNS, send provider commands or silently remediate customer infrastructure.</p></div></CardContent></Card>
      </main>
    </div>
  );
}

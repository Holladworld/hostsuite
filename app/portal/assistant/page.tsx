'use client';

import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, CircleAlert, Loader2, MessageCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_DIAGNOSTIC_CHECKS } from '@/lib/ai-assistant';

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link></div></header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3"><Bot className="h-6 w-6 text-primary" /></div><div><p className="text-sm font-medium text-primary">HostSuite Assistant</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">How can we help?</h1><p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">Tell us what is wrong. The assistant can guide you and, when connected to real checks, investigate your HostSuite services before escalating.</p></div></div>
        <Card className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5" /> Start with a problem</CardTitle><CardDescription>Common issues are kept simple. You do not need to know the technical cause.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><button className="rounded-xl border border-border p-4 text-left hover:border-primary/40"><p className="font-medium">My website isn't working</p><p className="mt-1 text-sm text-muted-foreground">Check website, HTTP, DNS, SSL and monitoring.</p></button><button className="rounded-xl border border-border p-4 text-left hover:border-primary/40"><p className="font-medium">My email isn't working</p><p className="mt-1 text-sm text-muted-foreground">Check the configured email service and domain health.</p></button><button className="rounded-xl border border-border p-4 text-left hover:border-primary/40"><p className="font-medium">My domain isn't working</p><p className="mt-1 text-sm text-muted-foreground">Check domain and DNS information.</p></button><button className="rounded-xl border border-border p-4 text-left hover:border-primary/40"><p className="font-medium">Something else</p><p className="mt-1 text-sm text-muted-foreground">Describe what you are experiencing.</p></button></div></CardContent></Card>
        <Card className="mt-6"><CardHeader><CardTitle>When you ask about a website</CardTitle><CardDescription>The assistant's diagnostic plan is deliberately explicit.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{DEFAULT_DIAGNOSTIC_CHECKS.map((check) => <div key={check} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm capitalize"><CheckCircle2 className="h-4 w-4 text-primary" />{check.replace('_', ' ')}</div>)}</div></CardContent></Card>
        <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">No invented diagnoses</p><p className="mt-1 text-sm leading-6 text-muted-foreground">The assistant will only report checks that HostSuite actually performed or data it actually received. If checks are unavailable or inconclusive, it will say so and escalate instead of guessing.</p></div></CardContent></Card>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><CircleAlert className="h-4 w-4" /> Live AI and diagnostic provider connections are configured separately from this interface.</div>
      </main>
    </div>
  );
}

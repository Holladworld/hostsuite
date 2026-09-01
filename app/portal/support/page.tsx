'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, LifeBuoy, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORT_PROBLEM_TYPES, getSupportPriorityLabel, type SupportProblemType } from '@/lib/support';

export default function SupportPage() {
  const [problem, setProblem] = useState<SupportProblemType | null>(null);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  const selected = SUPPORT_PROBLEM_TYPES.find((item) => item.type === problem);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div><p className="text-sm font-medium text-primary">Support</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">What’s happening?</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Tell us what went wrong. HostSuite can route normal issues to support and urgent outages to the emergency desk.</p></div>
        {!submitted ? <form onSubmit={submit} className="mt-8 space-y-6"><Card><CardHeader><CardTitle>Choose the problem</CardTitle><CardDescription>You don't need to know the technical cause.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{SUPPORT_PROBLEM_TYPES.map((item) => <button type="button" key={item.type} onClick={() => setProblem(item.type)} className={`rounded-xl border p-4 text-left transition-colors ${problem === item.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{getSupportPriorityLabel(item.priority)}</p></div>{item.priority === 'emergency' && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />}</div></button>)}</CardContent></Card>
          {problem && <Card><CardHeader><CardTitle>Tell us a little more</CardTitle><CardDescription>We will use this information to help diagnose the issue.</CardDescription></CardHeader><CardContent className="space-y-4"><Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What are you seeing? When did it start?" className="min-h-32" required />{selected?.priority === 'emergency' && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">This issue is marked for the emergency flow. In production, HostSuite will verify the incident and notify the appropriate support channel.</div>}<Button type="submit" className="gap-2"><Send className="h-4 w-4" /> Submit request</Button></CardContent></Card>}
        </form> : <Card className="mt-8"><CardContent className="p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><LifeBuoy className="h-6 w-6" /></div><h2 className="mt-4 font-display text-2xl font-bold">Request received</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your support workflow is ready for the next step. Ticket persistence, diagnostics, notifications and real emergency escalation will be connected to the support backend.</p><Button asChild className="mt-6 gap-2"><Link href="/portal/dashboard">Back to portal <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>}
      </main>
    </div>
  );
}

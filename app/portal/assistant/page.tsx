'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const shortcuts = [
  ['My website is not working', 'Check website availability and tell me what to do.'],
  ['My email is not working', 'Help me understand what could be wrong with my business email.'],
  ['My domain is not working', 'Help me troubleshoot my domain.'],
  ['Something else', 'I will describe the problem.'],
];

export default function AssistantPage() {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!message.trim()) return;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/ai/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'The assistant is unavailable.');
      setAnswer(data.answer);
    } catch (err) { setError(err instanceof Error ? err.message : 'The assistant is unavailable.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center px-4"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link></div></header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3"><Bot className="h-6 w-6 text-primary" /></div><div><p className="text-sm font-medium text-primary">HostSuite Assistant</p><h1 className="mt-1 text-3xl font-bold tracking-tight">How can we help?</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">You don't need to know the technical cause. Tell us what is happening and we'll guide you.</p></div></div>

        <Card className="mt-8"><CardHeader><CardTitle>Start with a problem</CardTitle><CardDescription>Pick the closest description or type your own.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{shortcuts.map(([title, prompt]) => <button key={title} type="button" onClick={() => setMessage(prompt)} className="rounded-xl border border-border p-4 text-left hover:border-primary/40"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{prompt}</p></button>)}</div>
          <form onSubmit={ask} className="mt-5 space-y-3"><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={4000} placeholder="Example: My website worked yesterday but customers now see an error." className="w-full rounded-xl border border-border bg-background p-3 text-sm" /><button disabled={loading || !message.trim()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Checking…' : 'Ask HostSuite'}</button></form>
          {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
        </CardContent></Card>

        {answer && <Card className="mt-6"><CardHeader><CardTitle>HostSuite response</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-7">{answer}</p></CardContent></Card>}

        <Card className="mt-6 border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">No invented diagnoses</p><p className="mt-1 text-sm leading-6 text-muted-foreground">The assistant only treats diagnostic results supplied by HostSuite as evidence. When live checks are unavailable or inconclusive, it says so instead of pretending it checked your infrastructure.</p></div></CardContent></Card>
      </main>
    </div>
  );
}

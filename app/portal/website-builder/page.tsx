'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function WebsiteBuilderPage() {
  const [submitted, setSubmitted] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteType, setWebsiteType] = useState('');
  const [busy, setBusy] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSubmitted(true);
    }, 350);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
          <p className="mt-5 text-sm font-medium text-primary">AI Website Builder</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Tell us about your business</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Start with a simple description. The actual AI generation, editing, preview and publishing steps will be connected after the builder architecture is selected.</p>
        </div>

        {!submitted ? (
          <Card className="mt-8">
            <CardHeader><CardTitle>Website brief</CardTitle><CardDescription>Nothing is published by submitting this form.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Acme Foods" required /></div>
                <div className="space-y-2"><Label htmlFor="website-type">What kind of website do you need?</Label><Input id="website-type" value={websiteType} onChange={(event) => setWebsiteType(event.target.value)} placeholder="e.g. business website, restaurant, portfolio, store" required /></div>
                <div className="space-y-2"><Label htmlFor="description">Tell us about your business</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What do you do, who do you serve, and what should visitors know?" className="min-h-32" required /></div>
                <Button type="submit" disabled={busy} className="w-full gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Continue</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8">
            <CardContent className="p-6 sm:p-8">
              <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-display text-xl font-semibold">Your website brief is ready</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">The brief has been captured in this browser session. AI generation, persistent project storage, editing, preview, domain connection and publishing are not implemented yet.</p></div></div>
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 text-sm"><p className="font-medium">{businessName}</p><p className="mt-1 text-muted-foreground">{websiteType}</p><p className="mt-3 leading-6 text-muted-foreground">{description}</p></div>
              <div className="mt-6 flex flex-wrap gap-2"><Button asChild variant="outline" className="gap-2"><Link href="/portal/dashboard"><ArrowLeft className="h-4 w-4" /> Back to portal</Link></Button><Button asChild variant="ghost" className="gap-2"><Link href="/get-started">Explore services <ArrowRight className="h-4 w-4" /></Link></Button></div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Describe</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tell HostSuite what your business needs.</p></div>
          <div className="rounded-xl border border-border p-4"><Globe2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Connect</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Connect a domain when the website is ready.</p></div>
          <div className="rounded-xl border border-border p-4"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Publish</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Publishing will be connected after the builder is implemented.</p></div>
        </div>
      </main>
    </div>
  );
}

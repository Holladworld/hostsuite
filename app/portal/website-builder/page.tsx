'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase-client';
import type { GeneratedSite } from '@/lib/ai-site';

export default function WebsiteBuilderPage() {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteType, setWebsiteType] = useState('');
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState<GeneratedSite | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSite(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before using the website builder.');

      const response = await fetch('/api/ai/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessName, websiteType, description }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We could not generate your website.');
      setSite(result.site as GeneratedSite);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'We could not generate your website.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
          <p className="mt-5 text-sm font-medium text-primary">AI Website Builder</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Tell us about your business</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Describe your business in plain language. HostSuite will turn the brief into a structured website draft you can review.</p>
        </div>

        {!site ? (
          <Card className="mx-auto mt-8 max-w-3xl">
            <CardHeader><CardTitle>Website brief</CardTitle><CardDescription>Nothing is published when you generate a draft.</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Acme Foods" required /></div>
                <div className="space-y-2"><Label htmlFor="website-type">What kind of website do you need?</Label><Input id="website-type" value={websiteType} onChange={(event) => setWebsiteType(event.target.value)} placeholder="e.g. business website, restaurant, portfolio, store" required /></div>
                <div className="space-y-2"><Label htmlFor="description">Tell us about your business</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What do you do, who do you serve, what makes you different, and what should visitors know?" className="min-h-40" required /></div>
                {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
                <Button type="submit" disabled={busy} className="w-full gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {busy ? 'Creating your draft…' : 'Generate my website'}</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-8 space-y-5">
            <Card className="overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-6 py-8 text-center"><p className="text-sm font-medium text-primary">Generated draft</p><h2 className="mt-2 font-display text-3xl font-bold">{site.siteName}</h2><p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{site.tagline}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{site.navigation.map((item) => <span key={item} className="rounded-full border border-border bg-background px-3 py-1 text-xs">{item}</span>)}</div></div>
              <CardContent className="space-y-4 p-6 sm:p-8">
                {site.blocks.map((block, index) => {
                  if (block.type === 'hero') return <section key={index} className="rounded-2xl border border-border p-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{block.eyebrow}</p><h3 className="mt-2 font-display text-2xl font-bold">{block.title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{block.description}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm">{block.primaryCta}</Button><Button size="sm" variant="outline">{block.secondaryCta}</Button></div></section>;
                  if (block.type === 'features') return <section key={index}><h3 className="font-display text-xl font-semibold">{block.title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{block.items.map((item) => <div key={item.title} className="rounded-xl border border-border p-4"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p></div>)}</div></section>;
                  if (block.type === 'about') return <section key={index} className="rounded-xl bg-muted/30 p-5"><h3 className="font-display text-xl font-semibold">{block.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{block.body}</p></section>;
                  return <section key={index} className="rounded-2xl border border-primary/20 bg-primary/5 p-6"><h3 className="font-display text-xl font-semibold">{block.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{block.description}</p><Button className="mt-4" size="sm">{block.button}</Button></section>;
                })}
              </CardContent>
            </Card>

            <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Draft generated successfully</p><p className="mt-1 text-sm text-muted-foreground">Editing, persistent project storage, domain connection and publishing are separate milestones. This draft has not been published.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSite(null)}>Start over</Button><Button asChild variant="ghost" className="gap-2"><Link href="/portal/dashboard">Back to portal <ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent></Card>
          </div>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Describe</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tell HostSuite what your business needs.</p></div>
          <div className="rounded-xl border border-border p-4"><Globe2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Connect</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Connect a domain when the website is ready.</p></div>
          <div className="rounded-xl border border-border p-4"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Publish</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Publishing comes after the website management and hosting stages.</p></div>
        </div>
      </main>
    </div>
  );
}

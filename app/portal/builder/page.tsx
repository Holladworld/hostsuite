'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BuilderPage() {
  const [businessName, setBusinessName] = useState('');
  const [websiteType, setWebsiteType] = useState('Business website');
  const [description, setDescription] = useState('');
  const [site, setSite] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setSite(null);
    try {
      const response = await fetch('/api/ai/generate-site', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, websiteType, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Website generation failed.');
      setSite(data.site);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Website generation failed.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center px-4"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link></div></header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Build with AI</CardTitle><CardDescription>Describe the business. HostSuite will create a structured first draft you can review.</CardDescription></CardHeader>
          <CardContent><form onSubmit={generate} className="space-y-4">
            <label className="block text-sm font-medium">Business name<input required minLength={2} maxLength={120} value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" /></label>
            <label className="block text-sm font-medium">Website type<select value={websiteType} onChange={(e) => setWebsiteType(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"><option>Business website</option><option>Professional service</option><option>Restaurant</option><option>Portfolio</option><option>Online store</option><option>Community / organization</option></select></label>
            <label className="block text-sm font-medium">Tell us about the business<textarea required minLength={20} maxLength={3000} rows={8} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you do, who do you serve, and what should the website help visitors do?" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" /></label>
            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
            <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Building…' : 'Generate website draft'}</button>
            <p className="text-xs leading-5 text-muted-foreground">Generation is metered in HostSuite. Deployment is intentionally separate: your published site should be deployable to infrastructure you control or choose.</p>
          </form></CardContent>
        </Card>

        <Card className="min-h-[560px]"><CardHeader><CardTitle>{site?.siteName || 'Your website draft'}</CardTitle><CardDescription>{site?.tagline || 'Your generated preview will appear here.'}</CardDescription></CardHeader><CardContent>
          {!site ? <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Tell HostSuite about your business and generate your first draft.</div> : <div className="space-y-5">{site.blocks.map((block: any, index: number) => <section key={`${block.type}-${index}`} className="rounded-xl border border-border p-5"><p className="text-xs font-medium uppercase tracking-wider text-primary">{block.type}</p><h2 className="mt-2 text-xl font-semibold">{block.title || block.headline || block.eyebrow}</h2>{block.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.description}</p>}{block.body && <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.body}</p>}{block.items && <div className="mt-4 grid gap-3 sm:grid-cols-2">{block.items.map((item: any) => <div key={item.title} className="rounded-lg bg-muted/50 p-3"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>)}</div>}</section>)}</div>}
        </CardContent></Card>
      </main>
    </div>
  );
}

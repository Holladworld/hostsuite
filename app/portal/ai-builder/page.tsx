'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/supabase-client';

type Status = { provider: string; configured: boolean; capabilities: string[] };

export default function AiBuilderPage() {
  const { user, loading } = useAuth(); const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', businessName: '', businessType: '', description: '', location: '', services: '', style: '' });
  useEffect(() => { if (!loading && !user) router.replace('/portal'); if (user) void fetch('/api/ai-builder/status').then((r) => r.ok ? r.json() : null).then(setStatus).catch(() => null); }, [loading, user, router]);
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/ai-builder/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, services: form.services.split(',').map((s) => s.trim()).filter(Boolean) }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Could not create project.'); router.push(`/portal/ai-builder/${result.project.id}`); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create project.'); setSaving(false); } }
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div><p className="text-sm font-medium text-primary">HostSuite AI</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Build your website with AI</h1><p className="mt-2 max-w-2xl text-muted-foreground">Tell us about the business first. HostSuite saves the real project brief so generation, editing, domains and deployment can be connected without losing your work.</p></div>
    <Card className="mt-7"><CardHeader><CardTitle>Website brief</CardTitle><CardDescription>This information becomes the starting specification for your website. You can refine it later.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-5"><div className="grid gap-5 md:grid-cols-2"><Field label="Project name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My business website" /></Field><Field label="Business name" required><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Acme Ltd" /></Field><Field label="Business type" required><Input value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} placeholder="Restaurant, consultancy, fashion brand..." /></Field><Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lagos, Nigeria" /></Field></div><Field label="What does the business do?" required><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the business, its customers, what makes it different, and what the website should help visitors do." rows={6} /></Field><div className="grid gap-5 md:grid-cols-2"><Field label="Services or products"><Input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Consulting, web design, support" /></Field><Field label="Preferred style"><Input value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })} placeholder="Modern, premium, minimal, bold..." /></Field></div>{error && <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={saving}>{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving project...</> : <><Sparkles className="mr-2 h-4 w-4" /> Create AI website project</>}</Button></form></CardContent></Card>
    <Card className="mt-5"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">AI generation connection</p><p className="mt-1 text-sm text-muted-foreground">{status?.configured ? 'The AI builder provider is configured for this environment.' : 'AI generation is not connected in this environment yet. Your project brief can still be saved safely.'}</p></div><Badge variant="outline">{status?.provider ?? 'checking'}</Badge></CardContent></Card>
    <div className="mt-5 grid gap-4 sm:grid-cols-3"><Capability title="Real project" text="Your project is stored in HostSuite, not browser-only state." /><Capability title="No fake deploys" text="A public URL appears only after a real deployment provider returns one." /><Capability title="Provider-ready" text="AI generation is isolated behind an adapter so OpenThorn can be connected without changing the customer workspace." /></div>
    <Button asChild variant="link" className="mt-4 px-0"><Link href="/portal/websites">Back to websites <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
  </div></main>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-sm font-medium">{label}{required ? ' *' : ''}</span>{children}</label>; }
function Capability({ title, text }: { title: string; text: string }) { return <Card><CardContent className="p-5"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></CardContent></Card>; }

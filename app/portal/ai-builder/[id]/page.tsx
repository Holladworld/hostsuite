'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, Loader2, Save, Sparkles } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/supabase-client';

type Project = { id: string; name: string; status: string; provider: string | null; deployment_url: string | null; custom_domain: string | null; metadata: Record<string, unknown> | null; updated_at: string };
function text(value: unknown, fallback = 'Not provided') { return typeof value === 'string' && value.trim() ? value : fallback; }
export default function AiBuilderProjectPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null); const [loadingProject, setLoadingProject] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  async function load() { const response = await fetch(`/api/ai-builder/projects/${params.id}`); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Could not load project.'); setProject(result.project); }
  useEffect(() => { if (!loading && !user) router.replace('/portal'); if (user) void load().catch(() => router.replace('/portal/websites')).finally(() => setLoadingProject(false)); }, [loading, user, router, params.id]);
  async function save() { if (!project) return; setSaving(true); setMessage(''); const response = await fetch(`/api/ai-builder/projects/${project.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: project.name, metadata: project.metadata }) }); const result = await response.json(); if (response.ok) { setProject(result.project); setMessage('Project saved.'); } else setMessage(result.error ?? 'Could not save project.'); setSaving(false); }
  if (loading || !user || loadingProject) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!project) return null;
  const metadata = project.metadata ?? {}; const services = Array.isArray(metadata.services) ? metadata.services.filter((x): x is string => typeof x === 'string') : [];
  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <Button asChild variant="ghost" className="mb-4 px-0"><Link href="/portal/websites"><ArrowLeft className="mr-2 h-4 w-4" /> Websites</Link></Button>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-primary">AI website project</p><Badge variant="outline" className="capitalize">{project.status}</Badge></div><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{project.name}</h1><p className="mt-2 text-muted-foreground">Project brief, generation readiness, domain and deployment state.</p></div><Button onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save changes'}</Button></div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader><CardTitle>Business brief</CardTitle><CardDescription>Edit the specification that will be supplied to the AI builder.</CardDescription></CardHeader><CardContent className="space-y-5"><label className="block space-y-2"><span className="text-sm font-medium">Project name</span><Input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} /></label><label className="block space-y-2"><span className="text-sm font-medium">Business description</span><Textarea value={text(metadata.description, '')} onChange={(e) => setProject({ ...project, metadata: { ...metadata, description: e.target.value } })} rows={7} /></label><div className="grid gap-5 sm:grid-cols-2"><Info label="Business" value={text(metadata.businessName)} /><Info label="Type" value={text(metadata.businessType)} /><Info label="Location" value={text(metadata.location)} /><Info label="Style" value={text(metadata.style)} /></div>{services.length > 0 && <div><p className="text-sm font-medium">Services / products</p><div className="mt-2 flex flex-wrap gap-2">{services.map((service) => <Badge key={service} variant="secondary">{service}</Badge>)}</div></div>}{message && <p className="text-sm text-muted-foreground">{message}</p>}</CardContent></Card>
      <div className="space-y-5"><Card><CardHeader><Sparkles className="h-6 w-6 text-primary" /><CardTitle>AI generation</CardTitle><CardDescription>HostSuite keeps generation behind a provider adapter. No generation is claimed until a real provider is connected.</CardDescription></CardHeader><CardContent><div className="rounded-xl border bg-muted/30 p-4 text-sm"><p className="font-medium">Provider: {text(project.provider, 'Not configured')}</p><p className="mt-1 text-muted-foreground">Generation and editing controls will become active when the configured provider exposes the required API capabilities.</p></div></CardContent></Card>
      <Card><CardHeader><Globe2 className="h-6 w-6 text-primary" /><CardTitle>Domain & deployment</CardTitle><CardDescription>These values are only shown when a real deployment or domain connection supplies them.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><Info label="Custom domain" value={text(project.custom_domain, 'Not connected')} /><Info label="Deployment" value={project.deployment_url ? 'Published' : 'Not deployed'} />{project.deployment_url && <Button asChild variant="outline" className="w-full"><a href={project.deployment_url} target="_blank" rel="noreferrer">Open published website</a></Button>}</CardContent></Card></div></div>
    </div>
  </div></main>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }

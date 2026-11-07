'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase-client';
import type { GeneratedSite } from '@/lib/ai-site';
import { DEPLOYMENT_TARGETS, type DeploymentTargetType } from '@/lib/deployment';

export default function WebsiteBuilderPage() {
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteType, setWebsiteType] = useState('');
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState<GeneratedSite | null>(null);
  const [error, setError] = useState('');
  const [deploymentTarget, setDeploymentTarget] = useState<DeploymentTargetType | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; status: string; updated_at: string }>>([]);
  useEffect(() => {
    const requestedProjectId = new URLSearchParams(window.location.search).get('projectId');
    if (!requestedProjectId) {
      let cancelled = false;
      const loadProjects = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) return;
          const response = await fetch('/api/ai-builder/projects', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (!response.ok) return;
          const result = await response.json();
          if (!cancelled) setProjects(Array.isArray(result.projects) ? result.projects : []);
        } catch (loadError) {
          console.error('Could not load saved website projects:', loadError);
        }
      };
      void loadProjects();
      return () => { cancelled = true; };
    }

    let cancelled = false;
    async function loadProject() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Please sign in again to open this website project.');

        const response = await fetch(`/api/ai-builder/projects/${requestedProjectId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'We could not open this website project.');
        if (cancelled) return;

        const project = result.project;
        const metadata = project?.metadata && typeof project.metadata === 'object' ? project.metadata : {};
        setProjectId(project.id);
        setBusinessName(typeof metadata.businessName === 'string' ? metadata.businessName : '');
        setWebsiteType(typeof metadata.businessType === 'string' ? metadata.businessType : '');
        setDescription(typeof metadata.description === 'string' ? metadata.description : '');
        if (metadata.generatedSite && typeof metadata.generatedSite === 'object') {
          setSite(metadata.generatedSite as GeneratedSite);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'We could not open this website project.');
      }
    }

    void loadProject();
    return () => { cancelled = true; };
  }, []);


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSite(null);
    setDeploymentTarget(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again before using the website builder.');
      let savedProjectId = projectId;
      if (savedProjectId) {
        const projectResponse = await fetch(`/api/ai-builder/projects/${savedProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ businessName, businessType: websiteType, description }),
        });
        const projectResult = await projectResponse.json();
        if (!projectResponse.ok) throw new Error(projectResult.error || 'We could not update your website project.');
      } else {
        const projectResponse = await fetch('/api/ai-builder/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ businessName, businessType: websiteType, description }),
        });
        const projectResult = await projectResponse.json();
        if (!projectResponse.ok) throw new Error(projectResult.error || 'We could not save your website project.');
        const createdProjectId = projectResult.project?.id as string | undefined;
        if (!createdProjectId) throw new Error('Your project was created, but we could not confirm its reference.');
        savedProjectId = createdProjectId;
        setProjectId(createdProjectId);
      }
      if (!savedProjectId) throw new Error('We could not confirm your website project reference.');

      const response = await fetch('/api/ai/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ businessName, websiteType, description, projectId: savedProjectId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'We could not generate your website.');
      setSite(result.site as GeneratedSite);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'We could not generate your website.');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8"><Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div><p className="mt-5 text-sm font-medium text-primary">AI Website Builder</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Build your website in plain language</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Tell HostSuite about your business. We will create a professional first draft for you to review.</p></div>
        {projects.length > 0 && !site && <Card className="mx-auto mt-8 max-w-3xl"><CardHeader><CardTitle>Your saved website projects</CardTitle><CardDescription>Continue a draft you have already started.</CardDescription></CardHeader><CardContent className="space-y-2">{projects.map((project) => <Link key={project.id} href={`/portal/website-builder?projectId=${project.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/50"><span className="min-w-0"><span className="block truncate text-sm font-medium">{project.name}</span><span className="mt-1 block text-xs capitalize text-muted-foreground">{project.status}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>)}</CardContent></Card>}
        {!site ? <Card className="mx-auto mt-8 max-w-3xl"><CardHeader><CardTitle>Website brief</CardTitle><CardDescription>Generating a draft does not publish anything.</CardDescription></CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-6"><div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Acme Foods" required /></div><div className="space-y-2"><Label htmlFor="website-type">What kind of website do you need?</Label><Input id="website-type" value={websiteType} onChange={(event) => setWebsiteType(event.target.value)} placeholder="e.g. business website, restaurant, portfolio" required /></div><div className="space-y-2"><Label htmlFor="description">Tell us about your business</Label><Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What do you do, who do you serve, what makes you different, and what should visitors know?" className="min-h-40" maxLength={2000} required /></div>{error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}<Button type="submit" disabled={busy} className="w-full gap-2">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{busy ? 'Creating your draft…' : 'Generate my website'}</Button></form></CardContent></Card> : <div className="mt-8 space-y-5">
          <Card className="overflow-hidden"><div className="border-b border-border bg-muted/30 px-6 py-8 text-center"><p className="text-sm font-medium text-primary">Generated draft</p><h2 className="mt-2 font-display text-3xl font-bold">{site.siteName}</h2><p className="mx-auto mt-2 max-w-2xl text-muted-foreground">{site.tagline}</p><div className="mt-4 flex flex-wrap justify-center gap-2">{site.navigation.map((item) => <span key={item} className="rounded-full border border-border bg-background px-3 py-1 text-xs">{item}</span>)}</div></div><CardContent className="space-y-4 p-6 sm:p-8">{site.blocks.map((block, index) => { if (block.type === 'hero') return <section key={index} className="rounded-2xl border border-border p-6"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{block.eyebrow}</p><h3 className="mt-2 font-display text-2xl font-bold">{block.title}</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{block.description}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm">{block.primaryCta}</Button><Button size="sm" variant="outline">{block.secondaryCta}</Button></div></section>; if (block.type === 'features') return <section key={index}><h3 className="font-display text-xl font-semibold">{block.title}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{block.items.map((item) => <div key={item.title} className="rounded-xl border border-border p-4"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.description}</p></div>)}</div></section>; if (block.type === 'about') return <section key={index} className="rounded-xl bg-muted/30 p-5"><h3 className="font-display text-xl font-semibold">{block.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{block.body}</p></section>; return <section key={index} className="rounded-2xl border border-primary/20 bg-primary/5 p-6"><h3 className="font-display text-xl font-semibold">{block.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{block.description}</p><Button className="mt-4" size="sm">{block.button}</Button></section>; })}</CardContent></Card>

          <Card><CardHeader><CardTitle>Where should your website live?</CardTitle><CardDescription>HostSuite does not put customer websites on the HostSuite application server.</CardDescription></CardHeader><CardContent className="space-y-3">{DEPLOYMENT_TARGETS.map((target) => <button key={target.type} type="button" onClick={() => setDeploymentTarget(target.type)} className={`w-full rounded-xl border p-4 text-left transition-colors ${deploymentTarget === target.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{target.label}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{target.description}</p></div>{deploymentTarget === target.type && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}</div></button>)}{deploymentTarget && <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6"><strong>Deployment selected.</strong> The actual provider connection and publishing workflow belongs to the website-management/hosting milestones. No deployment has happened yet.</div>}</CardContent></Card>

          <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">Draft generated and saved</p><p className="mt-1 text-sm text-muted-foreground">Your draft is saved in your HostSuite website project. Editing, domain connection and publishing are separate capabilities. This draft is not live.</p>{projectId && <Link href={`/portal/website-builder?projectId=${projectId}`} className="mt-2 inline-flex text-sm font-medium text-primary hover:underline">Open saved project</Link>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setSite(null); setDeploymentTarget(null); }}>Start over</Button><Button asChild variant="ghost" className="gap-2"><Link href="/portal/dashboard">Back to portal <ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent></Card>
        </div>}
        <div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border p-4"><Sparkles className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Describe</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Tell HostSuite what your business needs.</p></div><div className="rounded-xl border border-border p-4"><Globe2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Choose infrastructure</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use HostSuite-managed, existing, or your own infrastructure.</p></div><div className="rounded-xl border border-border p-4"><CheckCircle2 className="h-4 w-4 text-primary" /><p className="mt-3 text-sm font-medium">Publish later</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Publishing comes after the deployment integrations are ready.</p></div></div>
      </main>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ImagePlus, Save, Settings2, Tag, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type SiteSettings = Record<string, unknown>;
type BlogRow = { id: string; title: string; slug: string; excerpt: string | null; content: string | null; cover_image_url: string | null; published: boolean; published_at: string | null };

type HeroSettings = { headline: string; subheadline: string; primaryCta: string; secondaryCta: string; };
type PricingSettings = { starter_ops_monthly: number; starter_ops_annual: number; managed_growth_monthly: number; managed_growth_annual: number; };

const defaults: HeroSettings = {
  headline: 'Your business deserves a digital home that is easy to manage.',
  subheadline: 'Domains, websites, hosting, business email and technical support — with HostSuite handling the complexity behind the scenes.',
  primaryCta: 'Get started',
  secondaryCta: 'I need help',
};

const defaultPricing: PricingSettings = { starter_ops_monthly: 5000, starter_ops_annual: 50000, managed_growth_monthly: 12000, managed_growth_annual: 120000 };

export default function CmsPage() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [hero, setHero] = useState(defaults);
  const [pricing, setPricing] = useState(defaultPricing);
  const [siteName, setSiteName] = useState('HostSuite');
  const [logoUrl, setLogoUrl] = useState('');
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const [{ data: rows }, { data: blogRows }] = await Promise.all([
      supabase.from('site_settings').select('key,value'),
      supabase.from('blogs').select('id,title,slug,excerpt,content,cover_image_url,published,published_at').order('created_at', { ascending: false }),
    ]);
    const map = Object.fromEntries((rows ?? []).map((row) => [row.key, row.value])) as SiteSettings;
    setSettings(map);
    setHero({ ...defaults, ...(map.hero as Partial<HeroSettings> | undefined) });
    setPricing({ ...defaultPricing, ...(map.pricing as Partial<PricingSettings> | undefined) });
    const branding = (map.branding ?? {}) as { siteName?: string; logoUrl?: string };
    setSiteName(branding.siteName ?? 'HostSuite');
    setLogoUrl(branding.logoUrl ?? '');
    setBlogs(blogRows ?? []);
  }

  async function saveSetting(key: string, value: unknown) {
    setStatus('Saving…');
    const { error } = await supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setStatus(error ? `Could not save: ${error.message}` : 'Saved.');
    if (!error) setSettings((current) => ({ ...current, [key]: value }));
  }

  async function toggleBlog(blog: BlogRow) {
    const nextPublished = !blog.published;
    const { error } = await supabase.from('blogs').update({ published: nextPublished, published_at: nextPublished ? new Date().toISOString() : null }).eq('id', blog.id);
    if (!error) setBlogs((items) => items.map((item) => item.id === blog.id ? { ...item, published: nextPublished } : item));
    setStatus(error ? `Could not update blog: ${error.message}` : 'Blog status updated.');
  }

  async function uploadLogo(file: File) {
    setStatus('Uploading logo…');
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const path = `branding/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('hostsuite-assets').upload(path, file, { upsert: false, contentType: file.type });
    if (error) { setStatus(`Could not upload: ${error.message}`); return; }
    const { data } = supabase.storage.from('hostsuite-assets').getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setStatus('Logo uploaded. Save branding to publish it.');
  }

  const publishedCount = useMemo(() => blogs.filter((blog) => blog.published).length, [blogs]);

  return (
    <div className="min-h-screen bg-background"><header className="border-b border-border"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Link><span className="text-xs text-muted-foreground">{status || 'CMS'}</span></div></header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div><p className="text-sm font-medium text-primary">Content management</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Manage the HostSuite website</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Change basic public content without touching code: branding, hero copy, pricing and blog publishing.</p></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> Branding</CardTitle></CardHeader><CardContent className="space-y-4"><label className="space-y-2 block text-sm">Site name<Input value={siteName} onChange={(e) => setSiteName(e.target.value)} /></label><label className="space-y-2 block text-sm">Logo URL<Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" /></label><label className="block text-sm">Upload logo<input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && void uploadLogo(e.target.files[0])} /></label><Button onClick={() => void saveSetting('branding', { siteName, logoUrl })}><Save className="mr-2 h-4 w-4" />Save branding</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Homepage hero</CardTitle></CardHeader><CardContent className="space-y-4"><label className="space-y-2 block text-sm">Headline<Textarea value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} /></label><label className="space-y-2 block text-sm">Subheadline<Textarea value={hero.subheadline} onChange={(e) => setHero({ ...hero, subheadline: e.target.value })} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 block text-sm">Primary CTA<Input value={hero.primaryCta} onChange={(e) => setHero({ ...hero, primaryCta: e.target.value })} /></label><label className="space-y-2 block text-sm">Secondary CTA<Input value={hero.secondaryCta} onChange={(e) => setHero({ ...hero, secondaryCta: e.target.value })} /></label></div><Button onClick={() => void saveSetting('hero', hero)}><Save className="mr-2 h-4 w-4" />Save homepage copy</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Pricing</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2">{(['starter_ops_monthly','starter_ops_annual','managed_growth_monthly','managed_growth_annual'] as const).map((key) => <label key={key} className="space-y-2 block text-sm capitalize">{key.replaceAll('_', ' ')}<Input type="number" value={pricing[key]} onChange={(e) => setPricing({ ...pricing, [key]: Number(e.target.value) })} /></label>)}</div><Button onClick={() => void saveSetting('pricing', pricing)}><Save className="mr-2 h-4 w-4" />Save pricing</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Blog</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{publishedCount} published / {blogs.length} total. Create and edit posts in the existing blog workflow; this screen controls their public visibility.</p>{blogs.slice(0, 8).map((blog) => <div key={blog.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{blog.title}</p><p className="text-xs text-muted-foreground">/{blog.slug}</p></div><Button variant="outline" size="sm" onClick={() => void toggleBlog(blog)}>{blog.published ? 'Unpublish' : 'Publish'}</Button></div>)}{blogs.length === 0 && <p className="text-sm text-muted-foreground">No blog posts yet.</p>}</CardContent></Card>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Changes are stored in Supabase site content. Public pages read these values instead of requiring code edits.</div>
      </main>
    </div>
  );
}

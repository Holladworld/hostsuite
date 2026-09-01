'use client';

import { useState } from 'react';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Eye,
  EyeOff,
  Save,
  Link as LinkIcon,
} from 'lucide-react';
import { useAdminKnowledgeBase } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { KB_CATEGORIES } from '@/lib/constants';
import { toast } from 'sonner';
import type { KnowledgeBaseRow, KBCategory } from '@/lib/types';

const emptyForm = {
  id: undefined as string | undefined,
  title: '',
  slug: '',
  category: 'Email & Deliverability' as KBCategory,
  excerpt: '',
  content: '',
  published: false,
};

export function AdminKnowledgePanel() {
  const { articles, loading, saveArticle, deleteArticle } = useAdminKnowledgeBase();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? articles : articles.filter((a) => a.category === filter);

  function openNew() {
    setForm(emptyForm);
    setEditing(true);
  }

  function openEdit(article: KnowledgeBaseRow) {
    setForm({
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      excerpt: article.excerpt ?? '',
      content: article.content ?? '',
      published: article.published,
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Title and slug are required.');
      return;
    }
    const result = await saveArticle({
      id: form.id,
      title: form.title,
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt || undefined,
      content: form.content || undefined,
      published: form.published,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(form.id ? 'Knowledge base article updated.' : 'Article created.');
      setEditing(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const ok = await deleteArticle(id);
    if (ok) toast.success('Article deleted.');
    else toast.error('Failed to delete article.');
  }

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" /> Knowledge Base Studio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage documentation guides and developer FAQs.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Guide
        </Button>
      </div>

      {/* Category filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
        {KB_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              filter === cat
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No guides yet. Click "New Guide" to start.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((article) => (
            <div
              key={article.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{article.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className="bg-secondary/10 text-secondary">{article.category}</Badge>
                    <Badge className={article.published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                      {article.published ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {article.views}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(article)} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(article.id, article.title)}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Guide' : 'New Guide'}</DialogTitle>
            <DialogDescription>
              {form.id ? 'Update the documentation guide below.' : 'Create a new knowledge base guide.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="kb-title">Guide Title</Label>
              <Input
                id="kb-title"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) });
                }}
                placeholder="How to Configure SPF, DKIM, and DMARC Records"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="kb-slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="kb-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="configure-spf-dkim-dmarc"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">/knowledge/{form.slug || 'slug'}</p>
            </div>
            <div>
              <Label htmlFor="kb-category">Category</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {KB_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      form.category === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="kb-excerpt">Excerpt</Label>
              <Textarea
                id="kb-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="A short summary that appears in the knowledge hub…"
                className="mt-1.5 min-h-[60px]"
              />
            </div>
            <div>
              <Label htmlFor="kb-content">Content (Markdown supported)</Label>
              <Textarea
                id="kb-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="## Step 1: Log in to your DNS provider&#10;&#10;Detailed instructions here…"
                className="mt-1.5 min-h-[200px] font-mono-data text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm({ ...form, published: !form.published })}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  form.published
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {form.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {form.published ? 'Published' : 'Draft'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setEditing(false)} className="gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Save className="h-4 w-4" /> {form.id ? 'Update' : 'Create'} Guide
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

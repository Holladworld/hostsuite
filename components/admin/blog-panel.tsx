'use client';

import { useState } from 'react';
import {
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Eye,
  EyeOff,
  Save,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import { useAdminBlogs } from '@/hooks/use-admin';
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
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import type { BlogRow } from '@/lib/types';

const emptyForm = {
  id: undefined as string | undefined,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  tags: '',
  published: false,
};

export function AdminBlogPanel() {
  const { blogs, loading, saveBlog, deleteBlog } = useAdminBlogs();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setForm(emptyForm);
    setEditing(true);
  }

  function openEdit(blog: BlogRow) {
    setForm({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt ?? '',
      content: blog.content ?? '',
      cover_image_url: blog.cover_image_url ?? '',
      tags: (blog.tags ?? []).join(', '),
      published: blog.published,
    });
    setEditing(true);
  }

  async function handleUpload(file: File) {
    const ext = file.name.split('.').pop();
    const fileName = `blog-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('hostsuite-assets')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (error) {
      toast.error('Upload failed: ' + error.message);
      return;
    }
    const { data: urlData } = supabase.storage
      .from('hostsuite-assets')
      .getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, cover_image_url: urlData.publicUrl }));
    toast.success('Image uploaded.');
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error('Title and slug are required.');
      return;
    }
    const payload = {
      id: form.id,
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || undefined,
      content: form.content || undefined,
      cover_image_url: form.cover_image_url || undefined,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      published: form.published,
    };
    const result = await saveBlog(payload);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(form.id ? 'Blog post updated.' : 'Blog post created.');
      setEditing(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const ok = await deleteBlog(id);
    if (ok) toast.success('Blog post deleted.');
    else toast.error('Failed to delete post.');
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
            <Newspaper className="h-5 w-5 text-primary" /> Blog &amp; Media Publishing Studio
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, publish, and delete technical articles and case studies.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : blogs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card py-16 text-center">
          <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No articles yet. Click "New Article" to start.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-md"
            >
              {blog.cover_image_url ? (
                <div className="aspect-video overflow-hidden">
                  <img src={blog.cover_image_url} alt={blog.title} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-primary/5">
                  <Newspaper className="h-8 w-8 text-primary/20" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <Badge className={blog.published ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                    {blog.published ? (
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Published</span>
                    ) : (
                      <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Draft</span>
                    )}
                  </Badge>
                </div>
                <h3 className="mt-2 font-display text-sm font-semibold text-foreground">{blog.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{blog.excerpt}</p>
                <div className="mt-auto flex items-center gap-2 pt-3">
                  <Button size="sm" variant="outline" onClick={() => openEdit(blog)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(blog.id, blog.title)} className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Article' : 'New Article'}</DialogTitle>
            <DialogDescription>
              {form.id ? 'Update the blog post details below.' : 'Fill in the details to create a new blog post.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="blog-title">Article Title</Label>
              <Input
                id="blog-title"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) });
                }}
                placeholder="How to Fix Email Deliverability in 2026"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="blog-slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="blog-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  placeholder="how-to-fix-email-deliverability"
                  className="flex-1"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">/blog/{form.slug || 'slug'}</p>
            </div>
            <div>
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="A short summary that appears in the blog grid…"
                className="mt-1.5 min-h-[60px]"
              />
            </div>
            <div>
              <Label htmlFor="blog-content">Content (Markdown supported)</Label>
              <Textarea
                id="blog-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="## Heading&#10;&#10;Write your article here…"
                className="mt-1.5 min-h-[200px] font-mono-data text-sm"
              />
            </div>
            <div>
              <Label htmlFor="blog-tags">Tags (comma-separated)</Label>
              <Input
                id="blog-tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="email, deliverability, DNS"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Cover Image</Label>
              <div className="mt-1.5 space-y-3">
                <Input
                  value={form.cover_image_url}
                  onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                  placeholder="Paste image URL (Unsplash, Cloudinary, etc.)"
                />
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-all hover:border-primary/30 hover:text-primary">
                  <Upload className="h-4 w-4" />
                  Upload to Supabase Storage
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                  />
                </label>
                {form.cover_image_url && (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <img src={form.cover_image_url} alt="Cover preview" className="aspect-video w-full object-cover" />
                  </div>
                )}
              </div>
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
              <Save className="h-4 w-4" /> {form.id ? 'Update' : 'Create'} Article
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Calendar,
  Loader2,
  Newspaper,
  Tag,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePublishedBlogs } from '@/hooks/use-content';

export default function BlogPage() {
  const { blogs, loading } = usePublishedBlogs();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogs.forEach((b) => b.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [blogs]);

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      const matchesSearch =
        !search ||
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        (b.excerpt ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesTag = !activeTag || (b.tags ?? []).includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [blogs, search, activeTag]);

  const featured = blogs[0];

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
            <Newspaper className="h-3.5 w-3.5" /> Blog &amp; Guides
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Web Operations, Decoded.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Technical deep dives, case studies, and server health guides from the HostSuite engineering team.
          </p>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…"
                className="h-12 rounded-full border-border bg-card pl-12 pr-4 text-base shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  !activeTag
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Tag className="h-3 w-3" /> {tag}
                </button>
              ))}
            </div>
          )}

          {/* Featured article */}
          {featured && !search && !activeTag && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mb-12 grid gap-8 rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-xl lg:grid-cols-2 lg:p-8"
            >
              {featured.cover_image_url ? (
                <div className="relative aspect-video overflow-hidden rounded-2xl">
                  <img
                    src={featured.cover_image_url}
                    alt={featured.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-2xl bg-primary/10">
                  <Newspaper className="h-12 w-12 text-primary/30" />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <Badge className="w-fit bg-primary/10 text-primary">Featured</Badge>
                <h2 className="mt-4 font-display text-2xl font-bold text-foreground group-hover:text-primary sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {featured.published_at
                      ? new Date(featured.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently'}
                  </span>
                </div>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read Article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          {/* Article grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-20 text-center">
              <Newspaper className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search ? `No articles found for "${search}".` : 'No articles published yet. Check back soon.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((blog, i) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
                  >
                    {blog.cover_image_url ? (
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={blog.cover_image_url}
                          alt={blog.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-primary/5">
                        <Newspaper className="h-10 w-10 text-primary/20" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} className="bg-secondary/10 text-secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <h3 className="mt-3 font-display text-lg font-semibold text-foreground group-hover:text-primary">
                        {blog.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">{blog.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                          Read <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

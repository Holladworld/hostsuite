'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Tag,
  Share2,
  MessageCircle,
  Loader2,
  Newspaper,
  ArrowRight,
  Twitter,
  Linkedin,
  Facebook,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBlogBySlug, usePublishedBlogs } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export default function BlogArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { blog, loading } = useBlogBySlug(slug);
  const { blogs } = usePublishedBlogs();

  if (loading) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  if (!blog) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <Newspaper className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Article not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This article may have been moved or is no longer published.
          </p>
          <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/blog" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const related = blogs.filter((b) => b.slug !== blog.slug).slice(0, 3);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = encodeURIComponent(`${blog.title} — HostSuite Blog`);

  return (
    <SiteShell>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <Link href="/blog" className="text-muted-foreground hover:text-foreground">
            Blog
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate text-foreground">{blog.title}</span>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All Articles
          </Link>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Badge key={tag} className="bg-secondary/10 text-secondary">
                  <Tag className="mr-1 h-3 w-3" /> {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {blog.title}
          </h1>
          {blog.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground">{blog.excerpt}</p>
          )}

          <div className="mt-6 flex items-center justify-between border-y border-border py-4">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {blog.published_at
                ? new Date(blog.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Recently published'}
            </span>
            {/* Social share */}
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: blog.title, url: shareUrl });
                  } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
                aria-label="Copy link"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Cover image */}
        {blog.cover_image_url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-8 overflow-hidden rounded-2xl"
          >
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full object-cover"
            />
          </motion.div>
        )}

        {/* Content */}
        <div className="mt-10">
          <BlogContent content={blog.content ?? ''} />
        </div>

        {/* CTA: Tell Us Your Pain */}
        <div className="mt-12 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background p-8 text-center lg:p-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Facing a similar issue?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Run our free 60-second infrastructure audit. Tell us your pain and get a quote with
            turnaround time — no commitment required.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/#diagnostic" scroll className="gap-2">
                Tell Us Your Pain <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href={waLink('Hello HostSuite, I read your blog and need help with my infrastructure.')}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </Button>
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-foreground">Keep Reading</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
                >
                  {rel.cover_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={rel.cover_image_url}
                        alt={rel.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-primary/5">
                      <Newspaper className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                      {rel.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{rel.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </SiteShell>
  );
}

function BlogContent({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          const Tag = (`h${block.level}` as 'h2' | 'h3' | 'h4') ?? 'h2';
          return (
            <Tag key={i} className="font-display text-xl font-bold text-foreground mt-8">
              {block.text}
            </Tag>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="space-y-2.5">
              {block.items?.map((item, j) => (
                <li key={j} className="flex items-start gap-3 text-base leading-relaxed text-foreground/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote key={i} className="border-l-4 border-primary/40 bg-primary/5 py-3 pl-6 pr-4 text-base italic text-foreground/80">
              {block.text}
            </blockquote>
          );
        }
        if (block.type === 'code') {
          return (
            <pre key={i} className="overflow-x-auto rounded-xl border border-border bg-foreground p-4 text-sm text-background font-mono-data">
              <code>{block.text}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="text-base leading-relaxed text-foreground/85">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string };

function parseMarkdown(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{2,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    if (line.trim().startsWith('> ')) {
      blocks.push({ type: 'quote', text: line.trim().slice(2) });
      i++;
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line.trim() });
    i++;
  }

  return blocks;
}

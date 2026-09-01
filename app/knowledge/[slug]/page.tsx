'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Loader2,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useKnowledgeBaseBySlug, usePublishedKnowledgeBase } from '@/hooks/use-content';
import { waLink, BRAND } from '@/lib/constants';

export default function KnowledgeArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { article, loading } = useKnowledgeBaseBySlug(slug);
  const { articles } = usePublishedKnowledgeBase();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  if (loading) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  if (!article) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Guide not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This guide may have been moved or is no longer published.
          </p>
          <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/knowledge" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Knowledge Center
            </Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const related = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 3);

  return (
    <SiteShell>
      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 text-sm sm:px-6">
          <Link href="/knowledge" className="text-muted-foreground hover:text-foreground">
            Knowledge Center
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="truncate text-foreground">{article.title}</span>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All Guides
          </Link>

          <Badge className="mt-6 bg-secondary/10 text-secondary">{article.category}</Badge>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mt-4 text-lg text-muted-foreground">{article.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{article.views} views</span>
          </div>
        </motion.div>

        {/* Content */}
        <div className="mt-10">
          <MarkdownContent content={article.content ?? ''} />
        </div>

        {/* Helpfulness rating */}
        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <p className="text-center text-sm font-medium text-foreground">Was this guide helpful?</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setFeedback('up')}
              className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                feedback === 'up'
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-card text-muted-foreground hover:border-success/40 hover:text-success'
              }`}
            >
              <ThumbsUp className="h-4 w-4" /> Yes, it helped
            </button>
            <button
              onClick={() => setFeedback('down')}
              className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                feedback === 'down'
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive'
              }`}
            >
              <ThumbsDown className="h-4 w-4" /> No, I need more help
            </button>
          </div>
          {feedback === 'down' && (
            <div className="mt-4 text-center">
              <Button
                asChild
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a
                  href={waLink(`Hello HostSuite, I read the guide "${article.title}" but I still need help.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Talk to an Engineer on WhatsApp
                </a>
              </Button>
            </div>
          )}
          {feedback === 'up' && (
            <p className="mt-3 text-center text-xs text-success flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Thanks for the feedback!
            </p>
          )}
        </div>

        {/* WhatsApp CTA */}
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              Still stuck? We can fix it for you.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              WhatsApp our Emergency Ops Desk at {BRAND.whatsappDisplay}. A real engineer picks up.
            </p>
          </div>
          <Button
            asChild
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <a
              href={waLink(`Hello HostSuite, I need help after reading your guide: ${article.title}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Contact Emergency Desk
            </a>
          </Button>
        </div>

        {/* Related guides */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-foreground">Related Guides</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/knowledge/${rel.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-primary">
                    {rel.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{rel.excerpt}</p>
                  <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </SiteShell>
  );
}

function MarkdownContent({ content }: { content: string }) {
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
                <li key={j} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
          <p key={i} className="text-sm leading-relaxed text-foreground/85">
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

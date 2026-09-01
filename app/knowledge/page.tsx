'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  Mail,
  KeyRound,
  Gauge,
  CreditCard,
  ArrowRight,
  BookOpen,
  TrendingUp,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePublishedKnowledgeBase } from '@/hooks/use-content';
import { KB_CATEGORIES, waLink } from '@/lib/constants';
import type { KBCategory } from '@/lib/types';

const categoryIcons: Record<string, typeof Mail> = {
  'Email & Deliverability': Mail,
  'Access & Recovery': KeyRound,
  'Uptime & Performance': Gauge,
  'Billing & SLAs': CreditCard,
};

const categoryDescriptions: Record<string, string> = {
  'Email & Deliverability':
    'Fix spam issues, configure SPF/DKIM/DMARC, and ensure your corporate email reaches the inbox.',
  'Access & Recovery':
    'Recover lost cPanel, domain, and registrar access when your developer disappears.',
  'Uptime & Performance':
    'Speed up slow sites, handle traffic spikes, and maintain 99.99% uptime.',
  'Billing & SLAs':
    'Understand your plan, SLA response times, and billing cycle.',
};

export default function KnowledgePage() {
  const { articles, loading } = usePublishedKnowledgeBase();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<KBCategory | 'All'>('All');

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.excerpt ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, activeCategory]);

  const popular = useMemo(() => [...articles].sort((a, b) => b.views - a.views).slice(0, 4), [articles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 to-background py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
            <BookOpen className="h-3.5 w-3.5" /> Knowledge Center
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Fix it yourself, or call us.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Step-by-step guides for the most common web operations problems. Search for a fix,
            or reach the emergency desk if you need a human now.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guides — e.g. 'email spam', 'cPanel access'…"
                className="h-12 rounded-full border-border bg-card pl-12 pr-4 text-base shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {KB_CATEGORIES.map((cat, i) => {
              const Icon = categoryIcons[cat] ?? BookOpen;
              const count = categoryCounts[cat] ?? 0;
              return (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`group rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                    activeCategory === cat
                      ? 'border-primary/40 bg-primary/5 shadow-md'
                      : 'border-border bg-card hover:border-primary/20'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">{cat}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{categoryDescriptions[cat]}</p>
                  <p className="mt-3 text-xs font-medium text-primary">{count} guide{count !== 1 ? 's' : ''}</p>
                </motion.button>
              );
            })}
          </div>

          {/* Category filter pills */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === 'All'
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              All Guides
            </button>
            {KB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular guides */}
      {popular.length > 0 && activeCategory === 'All' && !search && (
        <section className="py-8 lg:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
              <TrendingUp className="h-5 w-5 text-secondary" /> Popular Guides
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link
                    href={`/knowledge/${article.slug}`}
                    className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
                  >
                    <Badge className="bg-secondary/10 text-secondary">{article.category}</Badge>
                    <h3 className="mt-3 font-display text-base font-semibold text-foreground group-hover:text-primary">
                      {article.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
                    <p className="mt-3 text-xs text-muted-foreground">{article.views} views</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All articles */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {activeCategory === 'All' ? 'All Guides' : activeCategory}
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card py-20 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm text-muted-foreground">
                {search
                  ? `No guides found for "${search}". Try a different search or contact us.`
                  : 'No guides published in this category yet.'}
              </p>
              <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                <a
                  href={waLink('Hello HostSuite, I need help with a web operations issue.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Talk to an Engineer
                </a>
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                >
                  <Link
                    href={`/knowledge/${article.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
                  >
                    <Badge className="w-fit bg-secondary/10 text-secondary">{article.category}</Badge>
                    <h3 className="mt-3 font-display text-lg font-semibold text-foreground group-hover:text-primary">
                      {article.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{article.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{article.views} views</span>
                      <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Read <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background p-8 text-center lg:p-12">
            <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Could not find your answer?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Our emergency ops desk is on WhatsApp. A real engineer picks up — no bots, no ticket queues.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <a
                href={waLink('Hello HostSuite, I need help — I could not find a guide in your Knowledge Center.')}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" /> WhatsApp Emergency Desk
              </a>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

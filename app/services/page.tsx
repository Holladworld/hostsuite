'use client';

import { motion } from 'framer-motion';
import {
  ServerCog,
  LifeBuoy,
  MailCheck,
  HardDriveDownload,
  Code2,
  Check,
  ArrowRight,
  Wrench,
  Layers,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { CtaSection } from '@/components/cta-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SERVICE_DETAILS } from '@/lib/constants';
import Link from 'next/link';

const iconMap: Record<string, React.ElementType> = {
  ServerCog,
  LifeBuoy,
  MailCheck,
  HardDriveDownload,
  Code2,
};

export default function ServicesPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-40 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="border-primary/20 bg-primary/5 text-primary">
              <Layers className="mr-1.5 h-3.5 w-3.5" /> Infrastructure Services
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground text-balance sm:text-5xl">
              Detailed infrastructure breakdown
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Every service below is delivered by engineers who own the outcome — not a support ticket queue. Pick the one matching your bottleneck and we will come prepared.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Service cards */}
      <section className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {SERVICE_DETAILS.map((s, i) => {
              const Icon = iconMap[s.icon] ?? Wrench;
              return (
                <motion.div
                  key={s.slug}
                  id={s.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="grid gap-0 lg:grid-cols-[1fr_1.3fr]">
                    {/* Left: summary */}
                    <div className="relative flex flex-col justify-between border-b border-border bg-gradient-to-br from-primary/5 to-background p-6 lg:border-b-0 lg:border-r sm:p-8">
                      <div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                          <Icon className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
                          {s.title}
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {s.summary}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {s.tools.map((tool) => (
                          <span
                            key={tool}
                            className="rounded-full border border-border bg-background px-2.5 py-1 font-mono-data text-xs text-muted-foreground"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: deliverables + CTA */}
                    <div className="p-6 sm:p-8">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        What is included
                      </p>
                      <ul className="mt-4 space-y-3">
                        {s.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-2.5 text-sm text-foreground/85">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                              <Check className="h-3 w-3" />
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <Button
                          asChild
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Link href={`/#diagnostic?issue=${s.painId}`} scroll className="gap-2">
                            Request Service <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaSection
        title="Not sure which service fits your situation?"
        subtitle="Run through the diagnostic tool and we will match your bottleneck to the right service automatically."
      />
    </SiteShell>
  );
}

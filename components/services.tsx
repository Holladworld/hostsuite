'use client';

import { motion } from 'framer-motion';
import {
  ServerCog,
  MailCheck,
  Code2,
  ShieldCheck,
  Headset,
  Globe2,
  Sparkles,
  LifeBuoy,
  ArrowLeftRight,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { SERVICES } from '@/lib/constants';

const iconMap: Record<string, LucideIcon> = {
  ServerCog,
  MailCheck,
  Code2,
  ShieldCheck,
  Headset,
  Globe2,
  Sparkles,
  LifeBuoy,
  ArrowLeftRight,
};

export function Services() {
  return (
    <section id="services" className="relative scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
            What we can take care of
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your business needs to work online
          </h2>
          <p className="mt-3 text-muted-foreground">
            From getting your first domain to keeping your website, email and online tools running smoothly — we handle the technical side.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => {
            const Icon = iconMap[s.icon] ?? ServerCog;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/5 transition-transform group-hover:scale-150" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-4 font-display text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
                <ul className="relative mt-4 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Check className="h-4 w-4 text-secondary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

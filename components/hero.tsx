'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Lock,
  MailCheck,
  Activity,
  Server,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND, waLink, HEALTH_METRICS, TRUST_LOGOS } from '@/lib/constants';
import { useSiteSettings } from '@/hooks/use-content';
import Link from 'next/link';

const HERO_BG = 'https://images.pexels.com/photos/37730212/pexels-photo-37730212.jpeg?auto=compress&cs=tinysrgb&w=1920';

const metricIcon: Record<string, React.ElementType> = {
  Uptime: Activity,
  SSL: Lock,
  'Email Deliverability': MailCheck,
  'Lagos Ping': Zap,
};

export function Hero() {
  const [ping, setPing] = useState(14);
  const { settings } = useSiteSettings();

  const headline = settings.hero?.headline || 'We don\'t just sell hosting. We manage your entire web infrastructure & fix your technical bottlenecks.';
  const subheadline = settings.hero?.subheadline || 'Ghosted by your developer? Emails landing in spam? Website constantly going down? HostSuite steps in as your fractional CTO and web operations team.';

  // Subtle live ping jitter for realism.
  useEffect(() => {
    const id = setInterval(() => {
      setPing((p) => {
        const next = p + (Math.random() * 4 - 2);
        return Math.max(9, Math.min(22, Math.round(next)));
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src={HERO_BG}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: copy + CTAs */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Fractional CTO &amp; Web Operations Team
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground text-balance sm:text-5xl lg:text-[3.4rem]"
            >
              {headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-7 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/#diagnostic" scroll className="gap-2">
                  Describe Your Issue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary"
              >
                <a
                  href={waLink('Hello HostSuite, I need immediate assistance with my business website.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Emergency WhatsApp Desk
                </a>
              </Button>
            </motion.div>

            {/* Trust logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trusted by teams across Nigeria &amp; beyond
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                {TRUST_LOGOS.map((logo) => (
                  <span
                    key={logo}
                    className="font-display text-sm font-semibold text-muted-foreground/70"
                  >
                    {logo}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Live Health Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-strong rounded-2xl border border-border p-5 shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">
                      Live Infrastructure Health
                    </p>
                    <p className="text-[11px] text-muted-foreground">hostsuite.status · real-time</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  LIVE
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {HEALTH_METRICS.map((m) => {
              const Icon = metricIcon[m.label] ?? Activity;
              const isPing = m.label === 'Lagos Ping';
              return (
                <div
                  key={m.label}
                  className="rounded-xl border border-border bg-background/80 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-secondary" />
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  </div>
                  <p className="mt-2 font-mono-data text-lg font-semibold text-foreground">
                    {isPing ? `${ping}ms` : m.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.label} · {m.unit}
                  </p>
                </div>
              );
            })}
              </div>

              {/* Mini uptime graph */}
              <div className="mt-4 rounded-xl border border-border bg-background/80 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-muted-foreground">90-day uptime</p>
                  <p className="font-mono-data text-xs font-semibold text-success">99.99%</p>
                </div>
                <div className="mt-2 flex h-10 items-end gap-[3px]">
                  {Array.from({ length: 45 }).map((_, i) => {
                    const h = 60 + Math.sin(i * 0.6) * 18 + Math.random() * 14;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-success/70"
                        style={{ height: `${Math.min(100, h)}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-foreground">All systems operational</p>
                </div>
                <span className="font-mono-data text-[11px] text-muted-foreground">
                  {BRAND.parent}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

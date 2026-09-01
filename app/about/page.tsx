'use client';

import { motion } from 'framer-motion';
import {
  Gauge,
  Timer,
  DatabaseBackup,
  ShieldCheck,
  Server,
  Building2,
  ArrowRight,
  Check,
  Layers,
  UserX,
} from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { CtaSection } from '@/components/cta-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CORE_COMMITMENTS, TECH_STACK, BRAND } from '@/lib/constants';
import Link from 'next/link';

const commitmentIcon: Record<string, React.ElementType> = {
  Gauge,
  Timer,
  DatabaseBackup,
  ShieldCheck,
};

export default function AboutPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
        <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-24 top-40 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge className="border-secondary/30 bg-secondary/10 text-secondary">
              <Building2 className="mr-1.5 h-3.5 w-3.5" /> A {BRAND.parent} Division
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground text-balance sm:text-5xl">
              The Operations Engine Behind Reliable Web Infrastructure.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              HostSuite is a specialized managed web operations &amp; dev-ops division under {BRAND.parent}. We exist because too many businesses are held hostage by ghosted developers, broken email, and hosting that goes down at the worst possible moment.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/#diagnostic" scroll className="gap-2">
                  Describe Your Issue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services" className="gap-2">
                  <Layers className="h-4 w-4" /> Explore Our Services
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Commitments */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
              Core Commitments
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What we guarantee to every client
            </h2>
            <p className="mt-3 text-muted-foreground">
              These are not marketing promises. They are operational standards baked into how we run your infrastructure.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CORE_COMMITMENTS.map((c, i) => {
              const Icon = commitmentIcon[c.icon] ?? ShieldCheck;
              return (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 font-mono-data text-3xl font-bold text-foreground">{c.stat}</p>
                  <p className="mt-1 font-display text-sm font-semibold text-foreground">{c.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Stack Matrix */}
      <section className="relative py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-20" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              <Server className="h-3.5 w-3.5" /> Technical Stack
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              The infrastructure we run on
            </h2>
            <p className="mt-3 text-muted-foreground">
              We deploy across proven cloud and platform providers — chosen for reliability, cost-efficiency, and the ability to match each workload to the right environment.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-4 font-medium">Technology</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Role in our stack</th>
                </tr>
              </thead>
              <tbody>
                {TECH_STACK.map((t, i) => (
                  <motion.tr
                    key={t.name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 font-display font-semibold text-foreground">{t.name}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{t.description}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Fractional CTO Model */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                <UserX className="h-3.5 w-3.5" /> The Fractional CTO Model
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                We replace ghosted developers and fragmented hosting support
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Most businesses do not need a full-time engineering team. They need a reliable partner who owns the technical layer end to end — someone who picks up the phone, documents the work, and treats your infrastructure like it is their own.
              </p>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                HostSuite steps in as your fractional CTO and web operations team. One accountable partner for hosting, email, security, migrations, and custom builds — instead of three disconnected vendors who blame each other when something breaks.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Single point of accountability for your entire web stack',
                  'Strategy and infrastructure roadmaps, not just ticket fixes',
                  'Vendor and cost negotiation on your behalf',
                  'An engineering team that documents everything and never ghosts',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="glass-strong rounded-2xl border border-border p-6 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">The Old Way</p>
                    <p className="text-[11px] text-muted-foreground">fragmented &amp; risky</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {['A freelance developer who eventually stops replying', 'A host whose support tickets go nowhere', 'A separate email provider you barely configured', 'No one accountable when it all breaks'].map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-foreground/70">
                      <UserX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="my-5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-primary">vs.</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">The HostSuite Way</p>
                    <p className="text-[11px] text-muted-foreground">unified &amp; accountable</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {['One team owns hosting, email, security &amp; builds', '15-minute emergency WhatsApp response', 'Documented infrastructure &amp; quarterly roadmaps', 'A fractional CTO who actually picks up'].map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-lg bg-success/5 px-3 py-2 text-xs text-foreground/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      <span dangerouslySetInnerHTML={{ __html: item }} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <CtaSection
        title="Want a partner who owns your whole web stack?"
        subtitle="Tell us what is breaking and we will show you exactly how we would run it instead."
      />
    </SiteShell>
  );
}

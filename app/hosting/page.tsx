import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Server, ShieldCheck } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Website Hosting | HostSuite',
  description: 'Explore website hosting and management support from HostSuite before creating an account.',
};

const options = [
  { title: 'Starting a new website', description: 'Get help choosing a hosting setup that fits the website you are preparing to launch.', points: ['Guidance on the right hosting environment', 'Domain and website setup guidance', 'A clear route from idea to launch'], action: 'Plan a new website' },
  { title: 'Moving an existing website', description: 'Bring a website from another provider and plan the move before changing anything.', points: ['Review your current hosting needs', 'Plan files, databases and email dependencies', 'Coordinate migration and DNS changes'], action: 'Discuss a migration' },
  { title: 'Looking after a live website', description: 'Get practical help with maintenance, updates, backups and the issues that interrupt your work.', points: ['Ongoing website care options', 'Maintenance and troubleshooting', 'Help understanding your existing setup'], action: 'Explore website care' },
];

export default function HostingPage() {
  return (
    <SiteShell>
      <section className="bg-[#F6F0FA]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70418D]">Website hosting</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#321747] sm:text-5xl lg:text-6xl">Hosting that fits the website you actually need.</h1>
            <p className="max-w-xl text-base leading-8 text-[#62536B]">Whether you are starting fresh, moving from another provider or trying to keep an existing website healthy, we will help you choose the right next step.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Server className="h-5 w-5" /></div><div><h2 className="text-2xl font-semibold tracking-tight">Explore your hosting needs</h2><p className="mt-1 text-sm text-muted-foreground">See the options before creating an account.</p></div></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {options.map((option) => <article key={option.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"><h3 className="text-xl font-semibold">{option.title}</h3><p className="mt-3 min-h-[72px] text-sm leading-6 text-muted-foreground">{option.description}</p><ul className="mt-5 flex-1 space-y-3">{option.points.map((point) => <li key={point} className="flex gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{point}</li>)}</ul><Button asChild className="mt-7 w-full justify-between"><Link href="/#diagnostic">{option.action}<ArrowRight className="h-4 w-4" /></Link></Button></article>)}
        </div>
        <div className="mt-8 rounded-2xl border border-[#E4D6ED] bg-[#FBF8FD] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl"><div className="flex items-center gap-2 text-[#542477]"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-semibold">Want to compare specific hosting packages?</p></div><p className="mt-2 text-sm leading-6 text-[#62536B]">Tell us what you are building and we can guide you to a suitable option. HostSuite's public catalogue does not yet contain verified provider package names and prices, so we will not show made-up plans or rates.</p></div>
            <Button asChild variant="outline" className="shrink-0 border-[#542477]/30 text-[#542477] hover:bg-[#F1E7F7]"><Link href="/#diagnostic">Get hosting guidance <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

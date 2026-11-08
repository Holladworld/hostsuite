import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, MessageCircle, Server, ShieldCheck } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { Button } from '@/components/ui/button';
import { waLink } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Website Hosting | HostSuite',
  description: 'Explore website hosting and get help choosing the right setup before creating an account.',
};

const options = [
  {
    title: 'Starting a new website',
    description: 'Choose a suitable hosting environment for a new business website, with guidance on the essentials before you launch.',
    points: ['Compare suitable hosting environments', 'Plan domain and website setup', 'Understand the steps to launch'],
    action: 'Plan my website hosting',
    message: 'Hello HostSuite, I am starting a new website and would like help choosing a suitable hosting option.',
  },
  {
    title: 'Moving an existing website',
    description: 'Move your website from another provider with a plan for files, databases, email and DNS before anything changes.',
    points: ['Review your current hosting setup', 'Plan files, databases and email dependencies', 'Coordinate migration and DNS changes'],
    action: 'Discuss hosting migration',
    message: 'Hello HostSuite, I am considering moving my existing website to a new hosting provider. I would like to discuss the migration and hosting options.',
  },
  {
    title: 'Hosting for an existing website',
    description: 'Already have a website? Find a hosting setup that suits its current platform, traffic and resource requirements.',
    points: ['Review your website platform and needs', 'Choose an appropriate hosting environment', 'Understand renewal and ongoing hosting considerations'],
    action: 'Find hosting for my website',
    message: 'Hello HostSuite, I already have a website and would like help finding a suitable hosting option for it.',
  },
];

export default function HostingPage() {
  return (
    <SiteShell>
      <section className="bg-[#F6F0FA]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#70418D]">Website hosting</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#321747] sm:text-5xl lg:text-6xl">Hosting that fits the website you actually need.</h1>
            <div className="max-w-xl">
              <p className="text-base leading-8 text-[#62536B]">Whether you are starting fresh, moving from another provider or choosing a better home for an existing website, we can help you understand the options and make a confident choice.</p>
              <p className="mt-3 text-sm leading-6 text-[#62536B]">You can explore hosting independently. You do not need to complete a website-management diagnostic to ask about hosting.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Server className="h-5 w-5" /></div><div><h2 className="text-2xl font-semibold tracking-tight">Explore hosting options</h2><p className="mt-1 text-sm text-muted-foreground">Start with what you need. We will help you work out the right fit.</p></div></div>
        <div className="grid gap-5 lg:grid-cols-3">
          {options.map((option) => <article key={option.title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"><h3 className="text-xl font-semibold">{option.title}</h3><p className="mt-3 min-h-[72px] text-sm leading-6 text-muted-foreground">{option.description}</p><ul className="mt-5 flex-1 space-y-3">{option.points.map((point) => <li key={point} className="flex gap-2 text-sm leading-6"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{point}</li>)}</ul><Button asChild className="mt-7 w-full justify-between"><a href={waLink(option.message)} target="_blank" rel="noopener noreferrer">{option.action}<MessageCircle className="h-4 w-4" /></a></Button></article>)}
        </div>
        <div className="mt-8 rounded-2xl border border-[#E4D6ED] bg-[#FBF8FD] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl"><div className="flex items-center gap-2 text-[#542477]"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-semibold">Want to compare specific hosting packages?</p></div><p className="mt-2 text-sm leading-6 text-[#62536B]">Ask us about the available options and we will help you compare what fits. Our public catalogue does not yet contain verified provider package names and prices, so we will not display made-up plans or rates.</p></div>
            <Button asChild variant="outline" className="shrink-0 border-[#542477]/30 text-[#542477] hover:bg-[#F1E7F7]"><a href={waLink('Hello HostSuite, I would like to compare your available website hosting packages, specifications and prices. Please help me understand the options.')} target="_blank" rel="noopener noreferrer">Ask about hosting plans <MessageCircle className="ml-2 h-4 w-4" /></a></Button>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Need help with a website that is already broken, inaccessible or difficult to manage?</p>
          <Button asChild variant="ghost" className="justify-between text-primary"><Link href="/#diagnostic">Get website support <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </SiteShell>
  );
}

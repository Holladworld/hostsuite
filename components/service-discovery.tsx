'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Mail, Server, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getServiceDecision, type CustomerIntent, type ServiceAction } from '@/lib/product';

const INTENTS: Array<{ id: CustomerIntent; title: string; description: string; icon: typeof Globe }> = [
  { id: 'need_website', title: 'I need a website', description: 'Build one yourself or have us build and manage it.', icon: Globe },
  { id: 'need_domain', title: 'I need a domain', description: 'Find and manage the web address for your business.', icon: Globe },
  { id: 'need_email', title: 'I need business email', description: 'Get professional email using your business domain.', icon: Mail },
  { id: 'need_hosting', title: 'I need hosting', description: 'Host a website you already have.', icon: Server },
  { id: 'already_have_website', title: 'I already have a website', description: 'Connect it, move it, or let us manage it.', icon: Server },
  { id: 'technical_problem', title: 'Something is wrong', description: 'Tell us what is happening and we will guide you.', icon: Wrench },
  { id: 'migration', title: 'I want to move my website', description: 'Move your website to HostSuite with help when needed.', icon: ArrowRight },
  { id: 'custom_technology', title: 'I need custom technology', description: 'Websites, applications, integrations and backend work.', icon: Sparkles },
  { id: 'not_sure', title: "I'm not sure", description: 'Start here and we will help you choose the right path.', icon: ShieldCheck },
];

const ACTION_COPY: Record<ServiceAction, { title: string; description: string }> = {
  self_service: { title: 'You can do this yourself', description: 'We will take you to the simplest available HostSuite setup for this service.' },
  managed_service: { title: 'Let HostSuite handle it', description: 'This is a good fit for a managed service. We will collect the details needed to help you.' },
  guided_help: { title: 'We will guide you', description: 'We will ask a few simple questions before recommending the next step.' },
};

export function ServiceDiscovery() {
  const [intent, setIntent] = useState<CustomerIntent | null>(null);
  const [mode, setMode] = useState<ServiceAction | null>(null);
  const decision = useMemo(() => (intent ? getServiceDecision(intent) : null), [intent]);

  if (!intent || !decision) {
    return (
      <section className="min-h-screen bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />Simple setup</span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">What do you need for your business?</h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">You do not need to know the technical terms. Pick what you are trying to do and HostSuite will guide you from there.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTENTS.map(({ id, title, description, icon: Icon }) => (
              <button key={id} type="button" onClick={() => { setIntent(id); setMode(null); }} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const actionCopy = ACTION_COPY[decision.nextAction];
  return (
    <section className="min-h-screen bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => { setIntent(null); setMode(null); }} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Start over</button>
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="h-6 w-6" /></div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground">{actionCopy.title}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{actionCopy.description}</p>
          <div className="mt-8 rounded-2xl bg-muted/50 p-5">
            <p className="text-sm font-semibold text-foreground">We recommend starting with</p>
            <div className="mt-3 flex flex-wrap gap-2">{decision.recommendedServices.map((service) => <span key={service} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium capitalize text-foreground">{service.replaceAll('_', ' ')}</span>)}</div>
          </div>
          {!mode ? (
            <div className="mt-8">
              <p className="text-sm font-semibold text-foreground">How would you like HostSuite to help?</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => setMode('self_service')} className="rounded-xl border border-border p-4 text-left hover:border-primary/40 hover:bg-muted/40"><p className="font-semibold text-foreground">I'll do it</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Show me the self-service path.</p></button>
                <button type="button" onClick={() => setMode('managed_service')} className="rounded-xl border border-border p-4 text-left hover:border-primary/40 hover:bg-muted/40"><p className="font-semibold text-foreground">You handle it</p><p className="mt-1 text-xs leading-5 text-muted-foreground">I want HostSuite to manage it.</p></button>
                <button type="button" onClick={() => setMode('guided_help')} className="rounded-xl border border-border p-4 text-left hover:border-primary/40 hover:bg-muted/40"><p className="font-semibold text-foreground">Guide me</p><p className="mt-1 text-xs leading-5 text-muted-foreground">I'm not sure what I need yet.</p></button>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="font-semibold text-foreground">Next step</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">This choice is now recorded as the intended HostSuite path. The detailed service flows will be connected as each service is implemented.</p>
              <Button asChild className="mt-5"><Link href="/portal">Continue to HostSuite</Link></Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

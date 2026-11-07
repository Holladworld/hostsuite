import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { SiteShell } from '@/components/site-shell';
import { DomainSearch } from './domain-search';

export const metadata: Metadata = {
  title: 'Find a Domain Name | HostSuite',
  description: 'Search for a domain name before creating an account. Register and manage your domain securely with HostSuite.',
};

export default function DomainsPage() {
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden bg-[#321747] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_10%,rgba(191,139,225,0.28),transparent_42%),linear-gradient(125deg,#321747,#542477_58%,#70418D)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7CFF5]">Your name on the internet</p>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Find a domain that feels like your business.</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/80">Search first. No account needed. When you are ready to register, create your HostSuite account and continue securely.</p>
            <div className="mt-8"><DomainSearch /></div>
          </div>
          <div className="rounded-[28px] border border-white/15 bg-white/[0.08] p-7 backdrop-blur-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#E7CFF5]"><ShieldCheck className="h-6 w-6" /></div>
            <h2 className="mt-6 font-display text-2xl font-semibold">Search openly. Manage securely.</h2>
            <div className="mt-6 space-y-5">
              <div><p className="font-semibold">Explore without signing in</p><p className="mt-1 text-sm leading-6 text-white/70">Check whether a name is available before deciding what to do next.</p></div>
              <div><p className="font-semibold">Your account protects ownership</p><p className="mt-1 text-sm leading-6 text-white/70">Registration, payment and domain controls belong inside your authenticated account.</p></div>
              <div><p className="font-semibold">Bring an existing domain too</p><p className="mt-1 text-sm leading-6 text-white/70">You can tell us about a domain you already own when setting up your services.</p></div>
            </div>
            <Link href="/portal?mode=signup" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">Create a HostSuite account <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6"><LockKeyhole className="h-5 w-5 text-primary" /><h2 className="mt-4 text-lg font-semibold">Already own a domain?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign in to view domains connected to your account and access the management controls available for your registrar.</p><Link href="/portal" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Go to sign in <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="rounded-2xl border border-border bg-card p-6"><h2 className="text-lg font-semibold">Need help choosing?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">If you are unsure which domain fits your business, HostSuite can help you work through the options.</p><Link href="/#diagnostic" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Get guided help <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </SiteShell>
  );
}

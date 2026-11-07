'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

const serviceIndex = [
  { number: '01', name: 'Domains', detail: 'Find, connect and manage your address online', href: '/services' },
  { number: '02', name: 'Websites', detail: 'Create a new site or bring an existing one', href: '/portal/ai-builder' },
  { number: '03', name: 'Hosting', detail: 'Keep the systems behind your site in order', href: '/services#managed-servers' },
  { number: '04', name: 'Business email', detail: 'Set up mailboxes and resolve delivery issues', href: '/services#email-deliverability' },
];

export function Hero() {
  const { settings } = useSiteSettings();
  const headline = settings.hero?.headline?.trim() || 'Your digital infrastructure, in steadier hands.';
  const subheadline = settings.hero?.subheadline?.trim() || 'Websites, domains, hosting and business email — made easier to set up, manage, renew and improve. Get practical help without having to speak in technical language.';

  return (
    <section className="relative overflow-hidden bg-[#F5F1EA] text-[#21172A]">
      <div className="mx-auto grid max-w-7xl lg:min-h-[610px] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <p className="font-mono-data text-[11px] font-medium uppercase tracking-[0.2em] text-[#694C78]">
            HOSTSUITE <span className="mx-2 text-[#B9AABD]">/</span> DIGITAL INFRASTRUCTURE
          </p>
          <h1 className="mt-7 max-w-[12ch] font-display text-[clamp(3.25rem,6vw,5.8rem)] font-normal leading-[0.94] tracking-[-0.035em] text-balance">
            {headline}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#5E5662] sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-none bg-[#4A1F6B] px-6 text-white hover:bg-[#351449]">
              <Link href="/services" className="gap-3">
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-[#B9AABD] bg-transparent px-6 text-[#35243D] hover:bg-[#EDE5F0]">
              <Link href="/#diagnostic">Get help with a problem</Link>
            </Button>
          </div>
          <a
            href={waLink('Hello HostSuite, I would like to speak with someone about my business technology.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#4A1F6B] underline decoration-[#B9AABD] underline-offset-4 transition hover:decoration-[#4A1F6B]"
          >
            Prefer to talk to a person? <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="relative flex items-center bg-[#24132F] px-5 py-12 text-white sm:px-8 lg:px-12 lg:py-16">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-white/15 lg:block" />
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <p className="font-mono-data text-[10px] uppercase tracking-[0.18em] text-white/55">A clearer way to manage</p>
              <span className="font-mono-data text-[10px] text-white/45">01—04</span>
            </div>
            <div className="mt-3">
              {serviceIndex.map((item) => (
                <Link
                  key={item.number}
                  href={item.href}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-start gap-3 border-b border-white/15 py-5 transition-colors hover:border-white/45 sm:gap-5 sm:py-6"
                >
                  <span className="pt-1 font-mono-data text-xs text-[#BDA8CA]">{item.number}</span>
                  <span>
                    <span className="block font-display text-2xl font-normal leading-tight sm:text-3xl">{item.name}</span>
                    <span className="mt-1.5 block max-w-xs text-sm leading-6 text-white/60">{item.detail}</span>
                  </span>
                  <ArrowUpRight className="mt-1 h-4 w-4 text-white/45 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" />
                </Link>
              ))}
            </div>
            <p className="mt-7 max-w-sm text-sm leading-6 text-white/55">
              One practical place to start, whether you are building something new or taking care of what you already have.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

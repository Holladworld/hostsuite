'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export function Hero() {
  const { settings } = useSiteSettings();
  const cmsHeadline = settings.hero?.headline?.trim();
  const cmsSubheadline = settings.hero?.subheadline?.trim();
  const headline = !cmsHeadline || cmsHeadline === 'Your digital infrastructure, in steadier hands.'
    ? 'Your website should open doors. Not create problems.'
    : cmsHeadline;
  const subheadline = !cmsSubheadline || cmsSubheadline.startsWith('Websites, domains, hosting and business email')
    ? 'When updates pile up, your developer disappears or business email stops delivering, HostSuite steps in. We look after the website you already have, so you can get back to running your business.'
    : cmsSubheadline;

  return (
    <section className="relative overflow-hidden bg-[#F3EEE6] text-[#21172A]">
      <div className="mx-auto grid max-w-[1600px] lg:min-h-[650px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24 xl:px-20">
          <p className="font-mono-data text-[10px] font-medium uppercase tracking-[0.22em] text-[#795F83]">
            HOSTSUITE <span className="mx-2 text-[#B9AABD]">/</span> WEBSITE CARE & MANAGEMENT
          </p>
          <h1 className="mt-7 max-w-[12ch] font-display text-[clamp(3.5rem,6.5vw,6.8rem)] font-normal leading-[0.88] tracking-[-0.045em] text-balance">
            {headline}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#5E5662] sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-none bg-[#4A1F6B] px-6 text-white hover:bg-[#351449]">
              <Link href="/#diagnostic" className="gap-3">
                Tell us what is happening <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-[#B9AABD] bg-transparent px-6 text-[#35243D] hover:bg-[#E9E0EA]">
              <a href={waLink('Hello HostSuite, I would like to speak with someone about looking after my existing website.')} target="_blank" rel="noopener noreferrer">
                Speak to our team
              </a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#D9CFD8] pt-5 text-[11px] font-medium text-[#6D6270]">
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#79568B]" /> Keep your current website</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#79568B]" /> No forced hosting move</span>
            <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#79568B]" /> Help without the jargon</span>
          </div>
        </div>

        <div className="relative min-h-[420px] overflow-hidden bg-[#2A1B31] sm:min-h-[520px] lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=90"
            alt="Warm, considered contemporary interior with natural materials and soft architectural light"
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1025]/75 via-[#1C1025]/5 to-[#1C1025]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-10 lg:p-12">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/75">Considered care. Clear communication.</p>
            <p className="mt-3 max-w-lg font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              Your business deserves a website that is looked after.
            </p>
          </div>
          <span className="absolute right-5 top-5 font-mono-data text-[10px] tracking-[0.16em] text-white/75">HOSTSUITE / 01</span>
        </div>
      </div>
    </section>
  );
}

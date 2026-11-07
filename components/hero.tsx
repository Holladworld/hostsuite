'use client';

import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export function Hero() {
  const { settings } = useSiteSettings();
  const cmsHeadline = settings.hero?.headline?.trim();
  const cmsSubheadline = settings.hero?.subheadline?.trim();
  const headline = !cmsHeadline || cmsHeadline === 'Your digital infrastructure, in steadier hands.'
    ? 'Your website. Looked after.'
    : cmsHeadline;
  const subheadline = !cmsSubheadline || cmsSubheadline.startsWith('Websites, domains, hosting and business email')
    ? 'Already have a website? We help keep it working, make changes when you need them, and take care of the technical things you do not have time for.'
    : cmsSubheadline;

  return (
    <section className="relative overflow-hidden bg-[#F4F0E9] text-[#21172A]">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[650px] lg:grid-cols-[0.94fr_1.06fr]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24 xl:px-20">
          <p className="font-mono-data text-[10px] font-medium uppercase tracking-[0.22em] text-[#765C80]">
            HOSTSUITE <span className="mx-2 text-[#B9AABD]">/</span> WEBSITE MANAGEMENT
          </p>
          <h1 className="mt-7 max-w-[10ch] font-display text-[clamp(3.6rem,7.2vw,7.1rem)] font-normal leading-[0.88] tracking-[-0.045em] text-balance">
            {headline}
          </h1>
          <p className="mt-8 max-w-lg text-base leading-8 text-[#5E5662] sm:text-lg">
            {subheadline}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-13 rounded-none bg-[#4A1F6B] px-6 text-white hover:bg-[#351449]">
              <Link href="/#diagnostic" className="gap-3">
                Get help with my website <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-13 rounded-none border-[#B9AABD] bg-transparent px-6 text-[#35243D] hover:bg-[#EDE5F0]">
              <a href={waLink('Hello HostSuite, I would like to talk to someone about managing my existing website.')} target="_blank" rel="noopener noreferrer">
                Talk to a person
              </a>
            </Button>
          </div>
          <p className="mt-7 max-w-md text-xs leading-6 text-[#7A707D]">
            Built by a developer, made with AI, or managed by someone who is no longer available. You can start with the website you already have.
          </p>
        </div>

        <div className="relative min-h-[390px] overflow-hidden bg-[#2A1B31] sm:min-h-[500px] lg:min-h-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85')" }}
            role="img"
            aria-label="Warm, light-filled contemporary studio workspace"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1025]/75 via-[#1C1025]/10 to-[#1C1025]/10" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-10 lg:p-12">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-white/70">A calmer way to run your online business</p>
            <p className="mt-3 max-w-lg font-display text-3xl leading-tight sm:text-4xl lg:text-5xl">
              You run the business. We will help look after the website.
            </p>
            <Link href="/#services" className="mt-6 inline-flex items-center gap-2 border-b border-white/60 pb-2 text-sm font-semibold text-white hover:border-white">
              See what we can take care of <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <span className="absolute right-5 top-5 font-mono-data text-[10px] tracking-[0.16em] text-white/70">01 / HOSTSUITE</span>
        </div>
      </div>
    </section>
  );
}

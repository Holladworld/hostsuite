'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const { settings } = useSiteSettings();
  const cmsHeadline = settings.hero?.headline?.trim();
  const cmsSubheadline = settings.hero?.subheadline?.trim();
  const headline = !cmsHeadline || cmsHeadline === 'Your digital infrastructure, in steadier hands.'
    ? 'A better-run website. A lighter-running business.'
    : cmsHeadline;
  const subheadline = !cmsSubheadline || cmsSubheadline.startsWith('Websites, domains, hosting and business email')
    ? 'From the developer who disappeared to the emails that never arrive, we take care of the digital details that keep your business moving.'
    : cmsSubheadline;

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-[#17151A] text-[#F7F3EC]">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <motion.img
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2200&q=90"
          alt=""
          aria-hidden="true"
          className="h-[112%] w-full object-cover object-center opacity-65"
          style={{ y: reduceMotion ? 0 : imageY }}
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(19,16,21,0.98)_0%,rgba(25,20,27,0.92)_39%,rgba(25,20,27,0.46)_73%,rgba(25,20,27,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(19,16,21,0.58),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[690px] max-w-[1600px] flex-col justify-between px-5 pb-8 pt-20 sm:px-8 sm:pt-24 lg:min-h-[760px] lg:px-16 lg:pb-12 xl:px-24">
        <div className="max-w-[850px]">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#D8B68C]"
          >
            <span className="h-px w-9 bg-[#D8B68C]" />
            Website care, without the complexity
          </motion.p>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-[900px] font-display text-[clamp(3.4rem,8vw,7.8rem)] font-semibold leading-[0.91] tracking-[-0.075em] text-balance"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-[590px] text-base leading-8 text-white/76 sm:text-lg"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-14 rounded-none bg-[#D7B18A] px-7 text-sm font-bold text-[#211A1C] shadow-none hover:bg-[#E5C6A6]">
              <Link href="/#diagnostic" className="gap-3">
                Let’s sort out your website <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-none border-white/45 bg-white/[0.04] px-7 text-sm font-semibold text-white hover:bg-white/10 hover:text-white">
              <a href={waLink('Hello HostSuite, I would like to speak with someone about looking after my existing website.')} target="_blank" rel="noopener noreferrer">
                Speak to a real person
              </a>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.48 }}
          className="mt-20 grid gap-5 border-t border-white/25 pt-6 sm:grid-cols-3 sm:gap-8"
        >
          {[
            'Keep the website you already have',
            'No forced hosting move',
            'One-off help or ongoing care',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-xs font-medium tracking-[0.01em] text-white/75 sm:text-sm">
              <Check className="h-4 w-4 shrink-0 text-[#D8B68C]" />
              {item}
            </div>
          ))}
        </motion.div>
        <div className="pointer-events-none absolute bottom-12 right-8 hidden flex-col items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-white/50 xl:flex">
          <span>Scroll to explore</span>
          <span className="h-14 w-px bg-gradient-to-b from-[#D8B68C] to-transparent" />
        </div>
      </div>
    </section>
  );
}

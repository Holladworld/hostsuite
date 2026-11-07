'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Check, Mail, ShieldCheck, Wrench } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export function Hero() {
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();
  const cmsHeadline = settings.hero?.headline?.trim();
  const cmsSubheadline = settings.hero?.subheadline?.trim();
  const headline = !cmsHeadline || cmsHeadline === 'Build it. Launch it. Keep it running.'
    ? <>Your website,<br /><span className="text-[#6D3AA0]">taken care of.</span></>
    : cmsHeadline;
  const subheadline = !cmsSubheadline || cmsSubheadline.startsWith('Your website, domain, hosting')
    ? 'From lost access and email problems to everyday updates, we help keep your website working while you get on with business.'
    : cmsSubheadline;

  return (
    <section className="relative overflow-hidden bg-[#F8F5FB] text-[#261C30]">
      <div className="pointer-events-none absolute -right-24 -top-28 h-[420px] w-[420px] rounded-full bg-[#E9DDF4] opacity-70 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[590px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:px-12 lg:py-16">
        <div className="relative z-10">
          <motion.p initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-[#E2D5ED] bg-white px-3.5 py-2 text-[11px] font-bold tracking-[0.02em] text-[#5B3477] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#8D5BB5]" /> WEBSITE SUPPORT FOR BUSINESSES
          </motion.p>
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 max-w-[690px] font-display text-[clamp(3.5rem,6.5vw,6.4rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-[#261C30] [text-wrap:balance]"
          >
            {headline}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-6 max-w-[540px] text-base leading-8 text-[#62576B] sm:text-lg"
          >
            {subheadline}
          </motion.p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/#diagnostic" className="inline-flex min-h-[52px] items-center justify-center gap-3 rounded-xl bg-[#4A1F6B] px-6 py-4 text-sm font-bold text-white shadow-[0_8px_20px_rgba(74,31,107,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#5D2A86]">
              Let’s sort out your website <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a href={waLink('Hello HostSuite, I would like to speak with someone about looking after my existing website.')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-[#D8CBE3] bg-white px-6 py-4 text-sm font-bold text-[#4A1F6B] transition-colors hover:border-[#9E7BB9] hover:bg-[#F5EFF9]">
              Talk to a real person
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-[#655A70]">
            {['Keep the website you already have', 'No forced hosting move', 'One-off help or ongoing care'].map((item) => (
              <p key={item} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#6D3AA0]" />{item}</p>
            ))}
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative mx-auto w-full max-w-[610px] lg:ml-auto"
        >
          <div className="absolute -right-3 top-8 h-28 w-28 rounded-full bg-[#F7B69A] sm:-right-5 sm:h-36 sm:w-36" />
          <div className="absolute -bottom-5 left-5 h-24 w-24 rounded-full bg-[#CBB2E1] sm:h-32 sm:w-32" />
          <div className="relative overflow-hidden rounded-[28px] bg-[#4A1F6B] p-4 shadow-[0_28px_70px_rgba(61,31,81,0.2)] sm:p-6">
            <div className="flex items-center justify-between rounded-t-2xl border-b border-white/15 px-2 pb-4 text-white">
              <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-extrabold">H</span><span className="text-sm font-bold tracking-tight">Your website, looked after.</span></div>
              <span className="rounded-full bg-[#DDF5E7] px-3 py-1 text-[10px] font-bold text-[#276344]">In good hands</span>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-[1.08fr_0.92fr]">
              <div className="flex min-h-[250px] flex-col justify-between rounded-2xl bg-[#F5EFF9] p-5 text-[#2B1C36] sm:p-6">
                <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#80658F]">The care plan</span><ShieldCheck className="h-5 w-5 text-[#6D3AA0]" /></div>
                <div><p className="font-display text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-5xl">Less fixing.<br /><span className="text-[#75469B]">More doing.</span></p><p className="mt-3 max-w-[230px] text-xs leading-5 text-[#766A80]">Practical website support, explained in plain language.</p></div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-[#5B3477]"><span className="h-2 w-2 rounded-full bg-[#39A66B]" /> Support that stays with you</div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-1 flex-col justify-between rounded-2xl bg-[#F4A98A] p-4 text-[#3B2034]"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em]">01 / Recover</span><Wrench className="h-5 w-5" /></div><p className="text-sm font-bold leading-5">Get back into the website you own.</p></div>
                <div className="flex flex-1 flex-col justify-between rounded-2xl bg-[#E2D3EF] p-4 text-[#352343]"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.12em]">02 / Keep it working</span><Mail className="h-5 w-5" /></div><p className="text-sm font-bold leading-5">Keep email, updates and the small things in shape.</p></div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/15 px-2 pt-4 text-[10px] font-semibold text-white/70"><span>Real people. Clear next steps.</span><span>HOSTSUITE</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

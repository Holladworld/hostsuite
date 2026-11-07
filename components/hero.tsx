'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

export function Hero() {
  const { settings } = useSiteSettings();
  const reduceMotion = useReducedMotion();
  const cmsHeadline = settings.hero?.headline?.trim();
  const cmsSubheadline = settings.hero?.subheadline?.trim();
  const headline = !cmsHeadline || cmsHeadline === 'Build it. Launch it. Keep it running.'
    ? <>Your website<br /><em className="font-normal text-[#B96E4D]">shouldn’t</em> run<br />your business.</>
    : cmsHeadline;
  const subheadline = !cmsSubheadline || cmsSubheadline.startsWith('Your website, domain, hosting')
    ? 'When your developer disappears, your emails stop arriving or the small fixes pile up, we step in. Keep the website you have. Get the support you need.'
    : cmsSubheadline;

  return (
    <section className="relative isolate overflow-hidden bg-[#F3EEE5] text-[#211C1A]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.24]" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(#B8AA9B 1px, transparent 1px), linear-gradient(90deg, #B8AA9B 1px, transparent 1px)', backgroundSize: '72px 72px', maskImage: 'linear-gradient(to bottom, black, transparent 82%)' }} />
      <div className="relative mx-auto grid min-h-[680px] max-w-[1600px] items-stretch lg:min-h-[760px] lg:grid-cols-[1.02fr_0.98fr]">
        <div className="relative z-10 flex flex-col justify-between px-5 pb-10 pt-20 sm:px-9 sm:pt-24 lg:px-16 lg:pb-14 lg:pt-24 xl:pl-24">
          <div>
            <p className="flex items-center gap-3 font-mono-data text-[10px] font-medium uppercase tracking-[0.2em] text-[#805B49]">
              <span className="h-px w-10 bg-[#A66A4D]" /> WEBSITE MANAGEMENT, MADE HUMAN
            </p>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 max-w-[800px] font-display text-[clamp(4.2rem,8.6vw,9.2rem)] leading-[0.83] tracking-[-0.065em] text-[#211C1A] [text-wrap:balance]"
            >
              {headline}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="mt-9 max-w-[470px] text-base leading-8 text-[#655C55] sm:text-lg"
            >
              {subheadline}
            </motion.p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/#diagnostic" className="inline-flex min-h-14 items-center justify-between gap-8 bg-[#211C1A] px-6 text-sm font-semibold text-[#F8F3EB] transition-colors hover:bg-[#87533F]">
                Tell us what’s happening <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={waLink('Hello HostSuite, I would like to speak with someone about looking after my existing website.')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center justify-center border border-[#BFB3A6] px-6 text-sm font-semibold text-[#302823] transition-colors hover:border-[#87533F] hover:text-[#87533F]">
                Talk to a person
              </a>
            </div>
          </div>
          <div className="mt-16 grid max-w-[620px] grid-cols-1 gap-3 border-t border-[#CFC4B7] pt-5 text-xs font-medium text-[#655C55] sm:grid-cols-3">
            {['Keep the website you already own', 'No forced hosting move', 'One-off help or ongoing care'].map((item) => (
              <p key={item} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A76548]" />{item}</p>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden bg-[#29201E] text-[#F4EDE3] lg:min-h-full">
          <div className="absolute inset-0 opacity-30" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(#C9A78B 0.7px, transparent 0.7px)', backgroundSize: '18px 18px' }} />
          <div className="absolute -right-24 top-16 h-[470px] w-[470px] rounded-full border border-[#C59A79]/30" />
          <div className="absolute -right-8 top-32 h-[340px] w-[340px] rounded-full border border-[#C59A79]/25" />
          <div className="relative flex h-full min-h-[520px] flex-col justify-between p-6 sm:p-10 lg:min-h-[760px] lg:p-12">
            <div className="flex items-start justify-between border-b border-white/20 pb-5">
              <span className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#D8B99B]">The HostSuite approach</span>
              <span className="font-mono-data text-[10px] text-white/45">01 / 03</span>
            </div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative mx-auto w-full max-w-[520px] py-10"
            >
              <div className="absolute -left-5 top-3 z-10 hidden h-28 w-28 items-center justify-center rounded-full border border-[#D2A17E] bg-[#A75F43] text-center font-mono-data text-[9px] uppercase leading-5 tracking-[0.12em] text-white sm:flex">
                Less<br />technical<br />stress
              </div>
              <div className="relative rotate-[-2deg] border border-[#D9C5B1]/40 bg-[#F0E8DC] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#D7C9B9] pb-3 text-[#4A4039]">
                  <span className="font-display text-lg font-semibold tracking-[-0.05em]">yourbusiness.com</span>
                  <span className="font-mono-data text-[8px] uppercase tracking-[0.14em] text-[#927F70]">Website care file</span>
                </div>
                <div className="grid min-h-[245px] grid-cols-[1fr_0.72fr] gap-3 py-4">
                  <div className="flex flex-col justify-between bg-[#D8C9B8] p-4 text-[#30251F]">
                    <span className="font-mono-data text-[8px] uppercase tracking-[0.15em]">Your business, online</span>
                    <p className="font-display text-[clamp(2rem,4vw,3.7rem)] leading-[0.88] tracking-[-0.07em]">Back to<br /><em className="font-normal">business.</em></p>
                    <span className="h-1 w-16 bg-[#A75F43]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex-1 bg-[#B16B4E] p-3 text-white"><span className="font-mono-data text-[8px] uppercase tracking-[0.12em]">01 / Recover</span><div className="mt-8 h-px bg-white/50" /><p className="mt-2 text-[10px] leading-4">Access restored.<br />You’re back in control.</p></div>
                    <div className="flex-1 bg-[#34302D] p-3 text-[#F2E8DC]"><span className="font-mono-data text-[8px] uppercase tracking-[0.12em]">02 / Maintain</span><div className="mt-8 h-px bg-white/30" /><p className="mt-2 text-[10px] leading-4">Updates handled.<br />Nothing left to guess.</p></div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#D7C9B9] pt-3 font-mono-data text-[8px] uppercase tracking-[0.13em] text-[#74665A]">
                  <span>Care, clarity, continuity</span><span>HS / 2026</span>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-2 rotate-[4deg] bg-[#D5B38F] px-5 py-4 text-[#29201E] shadow-xl sm:-right-8">
                <span className="block font-mono-data text-[8px] uppercase tracking-[0.15em]">The promise</span>
                <span className="mt-1 block font-display text-2xl leading-none tracking-[-0.05em]">You stay in control.</span>
              </div>
            </motion.div>
            <div className="flex items-end justify-between border-t border-white/20 pt-5">
              <p className="max-w-[250px] text-xs leading-6 text-white/55">Practical help for the digital work you shouldn’t have to manage alone.</p>
              <Link href="/#services" className="flex h-12 w-12 items-center justify-center border border-white/35 text-white transition-colors hover:bg-white hover:text-[#29201E]" aria-label="Explore website care"><ArrowDownRight className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

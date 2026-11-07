'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const situations = [
  { n: '01', label: 'ACCESS & RECOVERY', title: 'Your developer has gone quiet.', copy: 'We help you regain access, understand what you own and get your website back into capable hands.', action: 'Recover my access', href: '/?issue=developer-ghosted#diagnostic', tint: 'bg-[#F1E8F8]', accent: 'text-[#67339A]' },
  { n: '02', label: 'BUSINESS EMAIL', title: 'Important messages aren’t arriving.', copy: 'Bounced mail, spam placement and mailbox problems deserve a proper diagnosis—not guesswork.', action: 'Fix my business email', href: '/services#email-deliverability', tint: 'bg-[#FCEDE6]', accent: 'text-[#A84F36]' },
  { n: '03', label: 'ONGOING WEBSITE CARE', title: 'The small jobs keep piling up.', copy: 'Updates, backups, security, content changes and maintenance—handled carefully and explained in plain language.', action: 'Explore website care', href: '/services#managed-servers', tint: 'bg-[#EAF3EE]', accent: 'text-[#347451]' },
  { n: '04', label: 'AI-BUILT WEBSITES', title: 'You built it. We’ll help it go further.', copy: 'Keep the freedom of building with AI. Bring in a real team for upkeep, improvements and the technical details.', action: 'Support my AI-built site', href: '/portal/ai-builder', tint: 'bg-[#E9EFFB]', accent: 'text-[#3F5D9C]' },
];

export function Services() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <section id="services" className="scroll-mt-20 bg-white py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col gap-5 sm:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#75469B]">A little help goes a long way</p>
              <h2 className="mt-4 max-w-[650px] font-display text-[clamp(2.8rem,5vw,5rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[#281936]">Whatever’s happening,<br className="hidden sm:block" /> we can help sort it.</h2>
            </div>
            <p className="max-w-[430px] text-sm leading-7 text-[#6B6173] sm:text-base">You already have a business to run. We look after the website details that keep getting in the way—starting with the problem you need solved today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {situations.map((item, index) => (
              <motion.article
                key={item.n}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.05 }}
                className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[22px] p-6 sm:min-h-[285px] sm:p-8 ${item.tint}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold tracking-[0.14em] ${item.accent}`}>{item.label}</span>
                  <span className="font-display text-3xl font-semibold tracking-[-0.06em] text-[#8D8198]/65">{item.n}</span>
                </div>
                <div className="relative z-10 mt-8 max-w-[500px]">
                  <h3 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#2B2035] sm:text-[2.15rem]">{item.title}</h3>
                  <p className="mt-3 max-w-[470px] text-sm leading-6 text-[#655A6D]">{item.copy}</p>
                  <Link href={item.href} className={`mt-5 inline-flex items-center gap-2 text-xs font-extrabold ${item.accent}`}>{item.action}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
                </div>
                <div className="pointer-events-none absolute -bottom-14 -right-10 h-40 w-40 rounded-full border-[22px] border-white/35 transition-transform duration-500 group-hover:scale-110" />
              </motion.article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#E9E1EF] bg-[#FBF9FD] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="max-w-2xl text-sm leading-6 text-[#655A6D]">Keep your current hosting if it works. A move or rebuild is only worth discussing when it genuinely helps.</p>
            <Link href="/services#zero-downtime-migration" className="inline-flex shrink-0 items-center gap-2 text-xs font-extrabold text-[#5B2B7E]">Explore your options <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[#321747] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#D8B8EE]">Simple from the first conversation</p>
              <h2 className="mt-4 max-w-[780px] font-display text-[clamp(2.8rem,5vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]">A clear next step.<br /><span className="text-[#D9B8F0]">No technical maze.</span></h2>
            </div>
            <p className="max-w-[400px] text-sm leading-7 text-white/70 lg:justify-self-end">You stay in control. We explain what needs doing, agree the work and take responsibility for the parts you want us to handle.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              { n: '01', title: 'Tell us what’s wrong', copy: 'Choose the issue and share what you know. No technical language needed.' },
              { n: '02', title: 'Get a clear plan', copy: 'We review the situation, explain your options and agree the scope.' },
              { n: '03', title: 'Get back to business', copy: 'We do the agreed work and keep you informed along the way.' },
            ].map((step) => (
              <motion.article key={step.n} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 sm:p-7">
                <span className="font-display text-4xl font-semibold text-[#D9B8F0]">{step.n}</span>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-[-0.035em]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">{step.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-websites" className="scroll-mt-20 overflow-hidden bg-[#F2EAF8] text-[#2B2035]">
        <div className="mx-auto grid max-w-[1440px] lg:min-h-[430px] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#75469B]">For the AI-built generation</p>
            <h2 className="mt-4 max-w-[680px] font-display text-[clamp(2.8rem,5vw,4.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Built it with AI?<br /><span className="text-[#6D3AA0]">We’ll help you keep it great.</span></h2>
            <p className="mt-5 max-w-[530px] text-sm leading-7 text-[#655A6D]">Keep the website you created. Bring in HostSuite when you need maintenance, improvements or a steady hand with the technical side. A rebuild is an option—not a condition of getting support.</p>
            <Link href="/portal/ai-builder" className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-[#4A1F6B] px-5 py-3.5 text-xs font-extrabold text-white transition-colors hover:bg-[#5D2A86]">Explore AI website creation <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-[#6B3A91] p-8 text-white lg:min-h-full">
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[36px] border-white/10" />
            <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[#F3A98A]" />
            <div className="relative max-w-[390px] rounded-2xl border border-white/25 bg-white/10 p-7 shadow-xl backdrop-blur-sm sm:p-9">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/70">Your website. Your terms.</span>
              <p className="mt-7 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl">Made by you.<br />Supported by us.</p>
              <div className="mt-8 border-t border-white/25 pt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-white/70">Build / Improve / Maintain</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

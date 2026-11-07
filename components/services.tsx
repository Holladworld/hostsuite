'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const situations = [
  { n: '01', label: 'ACCESS & RECOVERY', title: 'Your developer has gone quiet.', copy: 'We help you regain access, understand what you own and get your website back into capable hands.', action: 'Recover my access', href: '/?issue=developer-ghosted#diagnostic', note: 'Find your way back in' },
  { n: '02', label: 'BUSINESS EMAIL', title: 'Important messages aren’t arriving.', copy: 'Bounced mail, spam placement, missing records and mailbox trouble deserve a proper diagnosis—not guesswork.', action: 'Fix my business email', href: '/services#email-deliverability', note: 'Make every message count' },
  { n: '03', label: 'ONGOING WEBSITE CARE', title: 'The small jobs keep becoming big problems.', copy: 'Updates, backups, security, content changes and maintenance—handled carefully and explained in plain language.', action: 'Explore website care', href: '/services#managed-servers', note: 'Keep the details in hand' },
  { n: '04', label: 'AI-BUILT WEBSITES', title: 'You built it. Now make it dependable.', copy: 'Keep the freedom of building with AI. Bring in a real team for upkeep, improvements and the technical details.', action: 'Support my AI-built site', href: '/portal/ai-builder', note: 'A human team when you need one' },
];

export function Services() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <section id="services" className="scroll-mt-20 bg-[#F8F5EF] py-24 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-[1500px] px-5 sm:px-9 lg:px-16 xl:px-24">
          <div className="grid gap-10 border-b border-[#D6CBC0] pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#93634D]">When the digital details get difficult</p>
              <h2 className="mt-7 max-w-[600px] font-display text-[clamp(3rem,6.2vw,6.7rem)] leading-[0.9] tracking-[-0.065em] text-[#211C1A]">We take the weight <em className="font-normal text-[#A76548]">off</em> your website.</h2>
            </div>
            <div className="lg:justify-self-end lg:pb-2">
              <p className="max-w-[470px] text-base leading-8 text-[#655C55]">HostSuite is for businesses that already have a website and need someone dependable to look after it. Start with the problem in front of you. We’ll help you find the next step.</p>
              <p className="mt-5 font-mono-data text-[9px] uppercase tracking-[0.16em] text-[#9A8A7B]">Keep what works. Fix what doesn’t.</p>
            </div>
          </div>

          <div className="mt-5">
            {situations.map((item, index) => (
              <motion.article
                key={item.n}
                initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: reduceMotion ? 0 : index * 0.05 }}
                className="group grid gap-5 border-b border-[#D6CBC0] py-8 sm:py-10 lg:grid-cols-[0.16fr_0.9fr_0.9fr_0.42fr] lg:items-center lg:gap-8"
              >
                <span className="font-display text-4xl tracking-[-0.06em] text-[#B7A99B] lg:self-start">{item.n}</span>
                <div>
                  <p className="font-mono-data text-[9px] font-medium tracking-[0.18em] text-[#93634D]">{item.label}</p>
                  <h3 className="mt-3 max-w-[480px] font-display text-[clamp(1.9rem,3.2vw,3.35rem)] leading-[0.98] tracking-[-0.055em] text-[#211C1A]">{item.title}</h3>
                </div>
                <div className="lg:pl-5">
                  <p className="max-w-[440px] text-sm leading-7 text-[#655C55]">{item.copy}</p>
                  <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#87533F] transition-colors hover:text-[#211C1A]">{item.action}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
                </div>
                <div className="flex items-center justify-between border-l-2 border-[#B87555] bg-[#EEE7DD] px-4 py-4 lg:min-h-[92px] lg:flex-col lg:items-start lg:justify-center">
                  <span className="font-mono-data text-[8px] uppercase tracking-[0.16em] text-[#987C68]">HostSuite note</span>
                  <span className="font-display text-lg leading-tight tracking-[-0.03em] text-[#3B302A]">{item.note}</span>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[#D6CBC0] pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-[#655C55]">You do not have to move hosting to get better support. Migration, a new website or a fresh build can come later—if it is genuinely the right move.</p>
            <Link href="/services#zero-downtime-migration" className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[#87533F]">Explore your options <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[#29201E] py-24 text-[#F3EDE4] sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1500px] px-5 sm:px-9 lg:px-16 xl:px-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
            <div>
              <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#D4A987]">A clear way forward</p>
              <h2 className="mt-7 max-w-[850px] font-display text-[clamp(3rem,5.7vw,6rem)] leading-[0.9] tracking-[-0.06em]">No technical maze.<br /><em className="font-normal text-[#D4A987]">No guessing.</em></h2>
            </div>
            <p className="max-w-[390px] text-sm leading-7 text-white/60 lg:justify-self-end">You stay in control. We explain what needs doing, agree the work and take responsibility for the parts you want us to handle.</p>
          </div>
          <div className="mt-16 grid border-y border-white/20 md:grid-cols-3">
            {[
              { n: '01', title: 'Tell us what happened', copy: 'Choose the issue and share what you know. You do not need to speak developer.' },
              { n: '02', title: 'Get a clear plan', copy: 'We review the situation, explain the options and agree the scope before work begins.' },
              { n: '03', title: 'Get back to business', copy: 'We fix the issue or take on the agreed ongoing care, and keep you informed.' },
            ].map((step, index) => (
              <motion.article key={step.n} initial={reduceMotion ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: reduceMotion ? 0 : index * 0.08 }} className="border-b border-white/20 py-8 md:border-b-0 md:py-10 md:pr-8 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-8">
                <span className="font-display text-5xl tracking-[-0.07em] text-[#D4A987]">{step.n}</span>
                <h3 className="mt-7 font-display text-2xl tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">{step.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-websites" className="scroll-mt-20 overflow-hidden bg-[#DCC8B4] text-[#29201E]">
        <div className="mx-auto grid max-w-[1500px] lg:min-h-[500px] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center px-5 py-20 sm:px-9 lg:px-16 xl:pl-24">
            <p className="font-mono-data text-[10px] uppercase tracking-[0.2em] text-[#80533F]">For the AI-built generation</p>
            <h2 className="mt-7 max-w-[760px] font-display text-[clamp(3rem,5.5vw,5.8rem)] leading-[0.9] tracking-[-0.065em]">Keep the freedom.<br /><em className="font-normal text-[#87533F]">Bring the backup.</em></h2>
            <p className="mt-6 max-w-[540px] text-sm leading-7 text-[#5F5147]">Keep the website you created. Bring in HostSuite when you need maintenance, improvements or a steady hand with the technical side. A rebuild is an option—not a condition of getting support.</p>
            <Link href="/portal/ai-builder" className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#87533F] pb-2 text-xs font-semibold text-[#714632]">Explore AI website creation <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden bg-[#A96549] p-8 text-[#F8F0E7] lg:min-h-full">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(135deg, transparent 49.7%, #F4D7BF 50%, transparent 50.3%)', backgroundSize: '54px 54px' }} />
            <div className="relative max-w-[420px] border border-white/40 p-7 sm:p-10">
              <span className="font-mono-data text-[9px] uppercase tracking-[0.2em] text-white/65">Your website. Your terms.</span>
              <p className="mt-8 font-display text-5xl leading-[0.9] tracking-[-0.06em] sm:text-6xl">Built by you.<br /><em className="font-normal">Backed by us.</em></p>
              <div className="mt-10 flex items-center justify-between border-t border-white/35 pt-4 font-mono-data text-[8px] uppercase tracking-[0.15em] text-white/70"><span>Design / Build / Care</span><span>HS—04</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

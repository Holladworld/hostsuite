'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

const situations = [
  {
    number: '01',
    category: 'ACCESS & RECOVERY',
    title: 'The person who built it has gone quiet.',
    copy: 'We help you regain access, understand what you own and get your website back into capable hands.',
    action: 'Recover my access',
    href: '/?issue=developer-ghosted#diagnostic',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=88',
    alt: 'Quiet, light-filled professional workspace',
  },
  {
    number: '02',
    category: 'BUSINESS EMAIL',
    title: 'Important messages are not getting through.',
    copy: 'Bounced emails, spam folders and mailbox problems deserve a proper fix—not guesswork.',
    action: 'Fix my business email',
    href: '/services#email-deliverability',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=88',
    alt: 'Modern workspace with a focus on communication',
  },
  {
    number: '03',
    category: 'ONGOING WEBSITE CARE',
    title: 'The little jobs never seem to end.',
    copy: 'Updates, backups, security, content changes and maintenance—handled with care and explained in plain language.',
    action: 'Explore website care',
    href: '/services#managed-servers',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=88',
    alt: 'Calm, carefully designed contemporary interior',
  },
  {
    number: '04',
    category: 'AI-BUILT WEBSITES',
    title: 'You made the website. Now make it dependable.',
    copy: 'Keep the freedom of building with AI. Bring in a real team for upkeep, improvements and the technical details.',
    action: 'Support my AI-built site',
    href: '/#ai-websites',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=88',
    alt: 'Creative team collaborating in a bright studio',
  },
];

export function Services() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <section id="services" className="scroll-mt-20 bg-[#F4F0E9] py-24 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16 xl:px-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#956D58]"><span className="h-px w-8 bg-[#956D58]" /> A more considered kind of website support</p>
              <h2 className="mt-7 max-w-[850px] font-display text-[clamp(2.8rem,5.5vw,5.7rem)] font-semibold leading-[0.97] tracking-[-0.07em] text-[#211B1D]">
                You have a business to run. <span className="text-[#98735D]">We’ll mind the website.</span>
              </h2>
            </motion.div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, delay: 0.12 }}
              className="max-w-md pb-2 text-base leading-8 text-[#69615C] lg:justify-self-end"
            >
              A website should support your work—not become another job on your list. Whatever has gone wrong, we help you understand it, put it right and keep things moving.
            </motion.p>
          </div>

          <div className="mt-16 border-t border-[#D8CFC4]">
            {situations.map((item, index) => (
              <motion.article
                key={item.number}
                initial={reduceMotion ? false : { opacity: 0, y: 42 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.72, delay: reduceMotion ? 0 : (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group grid gap-6 border-b border-[#D8CFC4] py-8 sm:py-10 lg:grid-cols-[100px_0.9fr_1.1fr_180px] lg:items-center lg:gap-8"
              >
                <span className="font-display text-4xl font-semibold tracking-[-0.06em] text-[#B5A89B]">{item.number}</span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#956D58]">{item.category}</p>
                  <h3 className="mt-3 max-w-[440px] font-display text-[clamp(1.65rem,2.8vw,2.65rem)] font-semibold leading-[1.05] tracking-[-0.055em] text-[#211B1D]">{item.title}</h3>
                </div>
                <div className="grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center lg:contents">
                  <div className="relative h-[130px] overflow-hidden sm:h-[116px] lg:col-start-3 lg:row-start-1">
                    <img src={item.image} alt={item.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                  </div>
                  <div className="lg:col-start-4 lg:row-start-1">
                    <p className="max-w-sm text-sm leading-7 text-[#69615C]">{item.copy}</p>
                    <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#6D4438] transition-colors hover:text-[#211B1D]">
                      {item.action} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mt-10 flex flex-col gap-4 border-l-2 border-[#B48A68] bg-[#EAE3D9] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8"
          >
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#956D58]">A move is optional</p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#554D48]">You do not have to change hosting to get better support. If a migration or a new website makes sense later, we can plan that too.</p>
            </div>
            <Link href="/services#zero-downtime-migration" className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-[#6D4438]">Explore your options <ArrowUpRight className="h-4 w-4" /></Link>
          </motion.div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[#20191D] py-24 text-[#F5F0E9] sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-16 xl:px-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D6B08B]"><span className="h-px w-8 bg-[#D6B08B]" /> Straightforward from the first conversation</p>
              <h2 className="mt-7 max-w-[760px] font-display text-[clamp(2.8rem,5vw,5.2rem)] font-semibold leading-[0.97] tracking-[-0.07em]">No technical maze. Just a clear way forward.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-white/60 lg:justify-self-end">You stay in control. We explain what needs doing, agree the work and take responsibility for the parts you want us to handle.</p>
          </div>
          <div className="mt-16 grid border-y border-white/20 md:grid-cols-3">
            {[
              { n: '01', title: 'Tell us what’s wrong', copy: 'Choose the issue and share what you know. You do not need to speak developer.' },
              { n: '02', title: 'Get a clear plan', copy: 'We review the situation, explain the options and agree the scope before work begins.' },
              { n: '03', title: 'Get back to business', copy: 'We fix the issue or take on the agreed ongoing care, and keep you informed.' },
            ].map((step, index) => (
              <motion.article
                key={step.n}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.65, delay: reduceMotion ? 0 : index * 0.1 }}
                className="border-b border-white/20 py-8 md:border-b-0 md:py-9 md:pr-8 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:pl-8"
              >
                <span className="font-display text-5xl font-semibold tracking-[-0.07em] text-[#D6B08B]">{step.n}</span>
                <h3 className="mt-7 font-display text-2xl font-semibold tracking-[-0.04em]">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/60">{step.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-websites" className="scroll-mt-20 overflow-hidden bg-[#EAE3D9]">
        <div className="grid min-h-[540px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-20 sm:px-8 lg:px-16 xl:pl-[max(4rem,calc((100vw-1200px)/2))] xl:pr-16">
            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#956D58]"><span className="h-px w-8 bg-[#956D58]" /> For the AI-built generation</p>
            <h2 className="mt-7 max-w-[620px] font-display text-[clamp(2.8rem,5vw,5.1rem)] font-semibold leading-[0.96] tracking-[-0.07em] text-[#211B1D]">You built it with AI. We’ll help it go the distance.</h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#69615C]">Keep the website you created. Bring in HostSuite when you need maintenance, improvements or a steady hand with the technical side. A rebuild is an option—not a condition of getting support.</p>
            <Link href="/portal/ai-builder" className="mt-8 inline-flex w-fit items-center gap-3 border-b border-[#9C7A62] pb-2 text-xs font-bold text-[#6D4438]">Explore AI website creation <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative min-h-[360px] overflow-hidden lg:min-h-full">
            <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=90" alt="Creative team working together in a bright studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(234,227,217,0.2),transparent_30%)]" />
          </div>
        </div>
      </section>
    </>
  );
}

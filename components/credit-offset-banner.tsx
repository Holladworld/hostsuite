'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { waLink } from '@/lib/constants';

export function CreditOffsetBanner() {
  return (
    <section className="bg-[#321747] py-12 text-[#FFFFFF] lg:py-14">
      <motion.div initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="mx-auto grid max-w-[1500px] gap-5 px-5 sm:px-9 lg:grid-cols-[1fr_auto] lg:items-center lg:px-16 xl:px-24">
        <div className="grid gap-3 sm:grid-cols-[150px_1fr] sm:items-start">
          <p className="font-mono-data text-[9px] uppercase tracking-[0.18em] text-[#D9B8F0]">A smoother switch</p>
          <div><h3 className="font-display text-2xl tracking-[-0.04em] sm:text-3xl">Already paid your current host?</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">Our Credit Offset Program can match eligible remaining months when you move to HostSuite. No double billing and no wasted time—ask us to check your current plan.</p></div>
        </div>
        <a href={waLink('Hello HostSuite, I want to ask about the Credit Offset Program. I have already paid my current host.')} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-between gap-8 border border-white/35 px-5 text-xs font-semibold text-[#FFFFFF] transition-colors hover:bg-white hover:text-[#321747]">Ask about credit offset <ArrowUpRight className="h-4 w-4" /></a>
      </motion.div>
    </section>
  );
}

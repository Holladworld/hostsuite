'use client';

import { motion } from 'framer-motion';
import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { waLink } from '@/lib/constants';

export function CreditOffsetBanner() {
  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary/10 blur-2xl" />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  Credit Offset Program
                </h3>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Already paid your current host for the year? We will match your remaining months for <span className="font-semibold text-primary">FREE</span> when you switch today. No double billing, no wasted money.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={waLink('Hello HostSuite, I want to switch and use your Credit Offset Program. I have already paid my current host.')} target="_blank" rel="noopener noreferrer" className="gap-2">
                Claim my free months <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

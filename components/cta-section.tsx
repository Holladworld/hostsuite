'use client';

import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { waLink } from '@/lib/constants';
import Link from 'next/link';

export function CtaSection({
  title = 'Ready to hand off your web operations?',
  subtitle = 'Describe what is breaking and get an instant estimate — or reach our emergency desk on WhatsApp right now.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background p-8 text-center sm:p-12"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {subtitle}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/#diagnostic" scroll className="gap-2">
                  Describe Your Issue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary">
                <a href={waLink('Hello HostSuite, I need immediate assistance with my business website.')} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <MessageCircle className="h-4 w-4" /> Emergency WhatsApp Desk
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

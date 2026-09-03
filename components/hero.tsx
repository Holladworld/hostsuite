'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Globe2, Mail, ShieldCheck, Wrench } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSiteSettings } from '@/hooks/use-content';
import { waLink } from '@/lib/constants';

const slides = [
  {
    eyebrow: 'YOUR DIGITAL HOME',
    title: 'Build it. Launch it. Keep it running.',
    text: 'Your website, domain, hosting and business email — set up without the technical headache.',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1920',
    action: 'Get started',
  },
  {
    eyebrow: 'WHEN THINGS BREAK',
    title: 'Your developer disappeared? Bring it to us.',
    text: 'Website errors, broken email, DNS problems or a mysterious outage. Tell us what happened and we will help you find the fix.',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1920',
    action: 'Get technical help',
  },
  {
    eyebrow: 'DO IT YOURSELF OR LET US',
    title: 'Your infrastructure. Your choice.',
    text: 'Use HostSuite as a simple self-service platform, or let our team handle the technical work while you run your business.',
    image: 'https://images.pexels.com/photos/3862375/pexels-photo-3862375.jpeg?auto=compress&cs=tinysrgb&w=1920',
    action: 'Explore services',
  },
];

const quickNeeds = [
  { icon: Globe2, label: 'I need a domain' },
  { icon: Globe2, label: 'I need a website' },
  { icon: Mail, label: 'I need business email' },
  { icon: Wrench, label: 'Something is broken' },
];

export function Hero() {
  const { settings } = useSiteSettings();
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => {
    const id = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(id);
  }, []);

  const headline = settings.hero?.headline || slide.title;
  const subheadline = settings.hero?.subheadline || slide.text;

  return (
    <section className="relative overflow-hidden bg-[#4A1F6B] text-white">
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden="true"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#4A1F6B]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A1F6B] via-[#4A1F6B]/90 to-[#4A1F6B]/55" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="grid min-h-[440px] items-center gap-10 sm:min-h-[500px] lg:min-h-[560px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="max-w-2xl">
            <motion.div
              key={`eyebrow-${active}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/90 backdrop-blur-sm sm:mb-5 sm:px-3.5 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
            >
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{slide.eyebrow}</span>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45 }}
              >
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  {headline}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:mt-6 sm:text-lg">
                  {subheadline}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <Button asChild size="lg" className="w-full bg-[#5D2A86] text-white shadow-lg shadow-black/15 hover:bg-[#4A1F6B] sm:w-auto">
                <Link href="/#diagnostic" scroll className="gap-2">
                  {slide.action}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-white/35 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto">
                <a href={waLink('Hello HostSuite, I need help with my business technology.')} target="_blank" rel="noopener noreferrer">
                  Talk to a human
                </a>
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-2" aria-label="Hero slides">
              {slides.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show slide ${index + 1}`}
                  aria-current={index === active}
                  className={`h-1.5 rounded-full transition-all ${index === active ? 'w-9 bg-white' : 'w-4 bg-white/35 hover:bg-white/60'}`}
                />
              ))}
              <span className="ml-2 text-xs text-white/60">Auto-rotating</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="hidden lg:block"
          >
            <div className="rounded-3xl border border-white/20 bg-white/95 p-5 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-sm font-semibold">What do you need today?</p>
              <p className="mt-1 text-sm text-muted-foreground">Start with one thing. HostSuite can help with the rest.</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {quickNeeds.map(({ icon: Icon, label }) => (
                  <Link
                    key={label}
                    href="/#diagnostic"
                    className="group rounded-2xl border border-border bg-background p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <Icon className="h-5 w-5 text-[#5D2A86]" />
                    <span className="mt-8 block text-sm font-semibold">{label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground group-hover:text-foreground">Tell us what you need →</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#4A1F6B] px-4 py-3 text-white">
                <p className="text-sm font-semibold">Not sure what you need?</p>
                <p className="mt-1 text-xs text-white/70">That's okay. Describe the problem in plain English.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

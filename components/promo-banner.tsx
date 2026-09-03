'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Globe2, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';

const slides = [
  {
    eyebrow: 'NEW · AI WEBSITE BUILDER',
    title: 'Have an idea? Let’s turn it into a website.',
    text: 'Start with your business idea. HostSuite helps you move from blank page to a polished online presence.',
    action: 'Try the AI builder',
    href: '/portal/ai-builder',
    icon: Sparkles,
    image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'GET ONLINE, SIMPLY',
    title: 'Your domain. Your website. Your email.',
    text: 'Everything you need to look professional online, without having to figure out the technical bits alone.',
    action: 'See what we offer',
    href: '/services',
    icon: Globe2,
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
  {
    eyebrow: 'WE ARE HERE WHEN YOU NEED US',
    title: 'Something stopped working? Tell us what happened.',
    text: 'You do not need to know the technical name for the problem. Explain it normally and we will help you take the next step.',
    action: 'Get help',
    href: '/#diagnostic',
    icon: Mail,
    image: 'https://images.pexels.com/photos/3184436/pexels-photo-3184436.jpeg?auto=compress&cs=tinysrgb&w=1600',
  },
];

export function PromoBanner() {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const Icon = slide.icon;

  useEffect(() => {
    const id = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 7000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#241132] text-white shadow-2xl shadow-primary/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
            aria-hidden="true"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#241132]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#241132] via-[#241132]/85 to-[#241132]/35" />

        <div className="relative grid min-h-[300px] items-center gap-8 px-7 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-white/85 backdrop-blur-sm">
                <Icon className="h-3.5 w-3.5" />
                {slide.eyebrow}
              </div>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                {slide.title}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
                {slide.text}
              </p>
              <Link
                href={slide.href}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#241132] transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {slide.action}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 lg:self-end">
            {slides.map((item, index) => (
              <button
                key={item.eyebrow}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === active}
                className={`h-1.5 rounded-full transition-all ${index === active ? 'w-10 bg-white' : 'w-5 bg-white/35 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

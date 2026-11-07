'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const slides = [
  {
    number: '01',
    eyebrow: 'THE DEVELOPER HAS DISAPPEARED',
    title: 'Get back into the website you already own.',
    action: 'Recover access',
    href: '/?issue=developer-ghosted#diagnostic',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=85',
    position: 'center 48%',
  },
  {
    number: '02',
    eyebrow: 'BUSINESS EMAIL IS NOT DELIVERING',
    title: 'Make sure important messages get through.',
    action: 'Fix business email',
    href: '/?issue=email-spam#diagnostic',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85',
    position: 'center 55%',
  },
  {
    number: '03',
    eyebrow: 'YOUR WEBSITE WAS BUILT WITH AI',
    title: 'Keep the freedom. Get help with the upkeep.',
    action: 'Explore website care',
    href: '/#services',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=85',
    position: 'center 45%',
  },
];

export function PromoBanner() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[active];

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section
      className="relative isolate overflow-hidden bg-[#21132F] text-white"
      aria-label="Common website management situations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {slides.map((item, index) => (
        <div
          key={item.number}
          className={`absolute inset-0 -z-20 bg-cover transition-opacity duration-700 motion-reduce:transition-none ${active === index ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${item.image}')`, backgroundPosition: item.position }}
          aria-hidden="true"
        />
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1B1024]/95 via-[#24132F]/82 to-[#24132F]/35" />
      <div className="mx-auto flex min-h-[112px] max-w-[1600px] items-center justify-between gap-4 px-5 py-3 sm:min-h-[124px] sm:px-8 lg:px-14 xl:px-20">
        <div className="min-w-0 max-w-4xl" aria-live="polite" aria-atomic="true">
          <p className="font-mono-data text-[9px] tracking-[0.16em] text-[#D9C5E2]">{slide.number} <span className="mx-1.5 text-white/40">/ 03</span> {slide.eyebrow}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
            <h2 className="font-display text-xl font-normal leading-tight sm:text-2xl lg:text-[1.8rem]">{slide.title}</h2>
            <Link href={slide.href} className="inline-flex shrink-0 items-center gap-1.5 border-b border-white/60 pb-1 text-xs font-semibold text-white hover:border-white">
              {slide.action} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <button type="button" onClick={previous} aria-label="Previous banner" className="flex h-9 w-9 items-center justify-center border border-white/35 text-white transition hover:bg-white hover:text-[#24132F]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={next} aria-label="Next banner" className="flex h-9 w-9 items-center justify-center border border-white/35 text-white transition hover:bg-white hover:text-[#24132F]">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-5 right-5 flex gap-1 sm:left-8 sm:right-8 lg:left-14 lg:right-14 xl:left-20 xl:right-20" aria-label="Choose banner">
        {slides.map((item, index) => (
          <button key={item.number} type="button" onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} aria-current={active === index ? 'true' : undefined} className="h-0.5 flex-1 bg-white/30">
            <span className={`block h-full transition-all duration-300 ${active === index ? 'bg-white' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

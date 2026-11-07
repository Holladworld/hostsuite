'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const slides = [
  {
    number: '01',
    eyebrow: 'WHEN YOUR DEVELOPER IS NO LONGER AROUND',
    title: 'You should never be locked out of your own website.',
    text: 'Lost cPanel access, missing logins or no one to call? We can help you regain access and take things forward.',
    action: 'Get access help',
    href: '/?issue=developer-ghosted#diagnostic',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1800&q=85',
    position: 'center 48%',
  },
  {
    number: '02',
    eyebrow: 'WHEN BUSINESS EMAIL STOPS WORKING',
    title: 'The right messages should reach the right people.',
    text: 'We help investigate emails that bounce, disappear or land in spam, and get your business communication back on track.',
    action: 'Fix my business email',
    href: '/?issue=email-spam#diagnostic',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=85',
    position: 'center 55%',
  },
  {
    number: '03',
    eyebrow: 'WHEN YOU BUILT YOUR WEBSITE WITH AI',
    title: 'You made the website. We can help you look after it.',
    text: 'Bring your AI-built website to HostSuite for ongoing care, practical changes and help when something gets complicated.',
    action: 'Explore website help',
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
    if (paused) return;
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
      <div className="absolute inset-0 -z-20 bg-cover bg-center transition-[background-image] duration-700" style={{ backgroundImage: `url('${slide.image}')`, backgroundPosition: slide.position }} />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1B1024]/95 via-[#24132F]/78 to-[#24132F]/25" />
      <div className="mx-auto flex min-h-[300px] max-w-[1440px] items-center justify-between gap-8 px-5 py-9 sm:min-h-[320px] sm:px-8 lg:px-14 lg:py-10 xl:px-20">
        <div className="max-w-2xl" aria-live="polite" aria-atomic="true">
          <p className="font-mono-data text-[10px] tracking-[0.18em] text-[#D9C5E2]">{slide.number} <span className="mx-2 text-white/40">/ 03</span> {slide.eyebrow}</p>
          <h2 className="mt-4 max-w-[17ch] font-display text-3xl font-normal leading-[1.02] sm:text-4xl lg:text-[3.25rem]">{slide.title}</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">{slide.text}</p>
          <Link href={slide.href} className="mt-5 inline-flex items-center gap-2 border-b border-white/60 pb-1.5 text-sm font-semibold text-white hover:border-white">
            {slide.action} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button type="button" onClick={previous} aria-label="Previous banner" className="flex h-11 w-11 items-center justify-center border border-white/40 text-white transition hover:bg-white hover:text-[#24132F]">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={next} aria-label="Next banner" className="flex h-11 w-11 items-center justify-center border border-white/40 text-white transition hover:bg-white hover:text-[#24132F]">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="absolute bottom-0 left-5 right-5 flex gap-1.5 sm:left-8 sm:right-8 lg:left-14 lg:right-14 xl:left-20 xl:right-20" aria-label="Choose banner">
        {slides.map((item, index) => (
          <button key={item.number} type="button" onClick={() => setActive(index)} aria-label={`Show banner ${index + 1}`} aria-current={active === index ? 'true' : undefined} className="h-1 flex-1 bg-white/35">
            <span className={`block h-full transition-all duration-300 ${active === index ? 'bg-white' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
    </section>
  );
}

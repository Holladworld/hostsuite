'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from 'lucide-react';

const slides = [
  {
    id: 'website-care',
    eyebrow: 'WEBSITE CARE & SUPPORT',
    title: 'Your website should work as hard as you do.',
    description: 'Updates, fixes, security and practical support for the website you already own.',
    action: 'Get website support',
    href: '/services#managed-servers',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85',
    position: 'center 48%',
  },
  {
    id: 'business-email',
    eyebrow: 'BUSINESS EMAIL',
    title: 'Make every business email count.',
    description: 'Set up professional email or get help with messages that bounce, disappear or land in spam.',
    action: 'Explore email support',
    href: '/services#email-deliverability',
    image: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=2000&q=85',
    position: 'center 46%',
  },
  {
    id: 'new-website',
    eyebrow: 'NEW WEBSITE',
    title: 'Ready to give your business a home online?',
    description: 'Start with a guided website draft, then decide how you want to take it forward.',
    action: 'Start a new website',
    href: '/portal/website-builder',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=85',
    position: 'center 50%',
  },
  {
    id: 'domain',
    eyebrow: 'DOMAINS',
    title: 'Find the right name for your business.',
    description: 'Explore a domain, register the address you want and keep it managed in one place.',
    action: 'Find a domain',
    href: '/domains',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=85',
    position: 'center 50%',
  },
  {
    id: 'hosting',
    eyebrow: 'WEBSITE HOSTING',
    title: 'Give your website a reliable place to live.',
    description: 'Get hosting for a new site or bring the hosting you already use into view.',
    action: 'Explore hosting',
    href: '/hosting',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=2000&q=85',
    position: 'center 50%',
  },
  {
    id: 'migration',
    eyebrow: 'MIGRATION & RECOVERY',
    title: 'Moving on, or locked out? We can help.',
    description: 'Recover access, move your website carefully and keep the important things connected.',
    action: 'Talk through your options',
    href: '/services#zero-downtime-migration',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=2000&q=85',
    position: 'center 48%',
  },
];

export function ServiceImageCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slide = slides[active];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const previous = () => setActive((current) => (current - 1 + slides.length) % slides.length);
  const next = () => setActive((current) => (current + 1) % slides.length);

  return (
    <section
      aria-label="Explore HostSuite services"
      className="bg-white px-4 py-4 sm:px-8 sm:py-5 lg:px-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && Math.abs(end - start) > 45) {
          if (end < start) next();
          else previous();
        }
        touchStartX.current = null;
      }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div
          className="relative isolate flex min-h-[180px] overflow-hidden rounded-[16px] bg-[#321747] text-white shadow-[0_14px_38px_rgba(49,23,71,0.14)] sm:min-h-[220px] lg:min-h-[240px]"
          role="group"
          aria-roledescription="slide"
          aria-label={`${active + 1} of ${slides.length}: ${slide.eyebrow}`}
        >
          <div
            key={slide.id}
            className="absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-500"
            style={{
              backgroundImage: `url("${slide.image}")`,
              backgroundPosition: slide.position,
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(35,17,51,0.94)_0%,rgba(49,23,71,0.82)_42%,rgba(35,17,51,0.48)_100%)] sm:bg-[linear-gradient(90deg,rgba(35,17,51,0.96)_0%,rgba(49,23,71,0.86)_48%,rgba(35,17,51,0.32)_100%)]" aria-hidden="true" />

          <div className="flex w-full flex-col justify-between gap-3 p-4 sm:gap-5 sm:p-6 lg:p-7">
            <div className="max-w-[680px]">
              <p className="text-[9px] font-extrabold tracking-[0.18em] text-[#E6C9F7] sm:text-[10px]">{slide.eyebrow}</p>
              <h2 className="mt-2 max-w-[650px] font-display text-[clamp(1.35rem,3.3vw,2.7rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white [text-wrap:balance]">
                {slide.title}
              </h2>
              <p className="mt-2 max-w-[520px] text-[11px] leading-[1.45] text-white/90 sm:text-xs sm:leading-5">
                {slide.description}
              </p>
              <Link
                href={slide.href}
                className="mt-3 inline-flex min-h-8 items-center gap-2 rounded-lg bg-white px-3 py-2 text-[10px] sm:min-h-9 sm:px-3.5 sm:text-[11px] font-extrabold text-[#4A1F6B] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F5EAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1F6B]"
              >
                {slide.action}<ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5" aria-label="Choose a service slide">
                {slides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Show ${item.eyebrow.toLowerCase()} slide`}
                    aria-current={index === active ? 'true' : undefined}
                    className={`h-1 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1F6B] sm:h-1 ${index === active ? 'w-5 bg-white sm:w-6' : 'w-1 bg-white/55 hover:bg-white/90 sm:w-1.5'}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <span className="mr-1.5 hidden text-[9px] font-semibold tracking-[0.12em] text-white/70 sm:inline">{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
                <button type="button" onClick={previous} aria-label="Previous service" className="flex h-7 w-7 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-7 sm:w-7"><ArrowLeft className="h-3 w-3" /></button>
                <button type="button" onClick={next} aria-label="Next service" className="flex h-7 w-7 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-7 sm:w-7"><ArrowRight className="h-3 w-3" /></button>
                <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume automatic slides' : 'Pause automatic slides'} className="flex h-7 w-7 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-7 sm:w-7">
                  {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-right text-[9px] text-[#82778A]">Photography via Unsplash</p>
      </div>
    </section>
  );
}

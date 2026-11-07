'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const slides = [
  { eyebrow: 'ACCESS RECOVERY', title: 'Locked out of the website you own?', action: 'Find a way back in', href: '/?issue=developer-ghosted#diagnostic' },
  { eyebrow: 'BUSINESS EMAIL', title: 'Your emails should reach the people who need them.', action: 'Fix email delivery', href: '/?issue=email-spam#diagnostic' },
  { eyebrow: 'WEBSITE CARE', title: 'Keep your website working while you run your business.', action: 'Explore ongoing care', href: '/#services' },
];

export function PromoBanner() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(id);
  }, []);
  const slide = slides[active];

  return (
    <section aria-label="Website support highlights" className="bg-[#A96549] text-[#FFF8F0]">
      <div className="mx-auto grid max-w-[1600px] items-center gap-4 px-5 py-5 sm:px-9 lg:grid-cols-[150px_1fr_auto] lg:px-16 xl:px-24">
        <p className="font-mono-data text-[9px] font-medium uppercase tracking-[0.2em] text-white/70">{slide.eyebrow}</p>
        <div className="min-w-0">
          <p key={slide.title} className="font-display text-xl leading-tight tracking-[-0.035em] sm:text-2xl">{slide.title}</p>
        </div>
        <div className="flex items-center justify-between gap-5 lg:justify-end">
          <Link href={slide.href} className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-white underline decoration-white/45 underline-offset-4 hover:decoration-white">{slide.action}<ArrowUpRight className="h-4 w-4" /></Link>
          <div className="flex gap-1.5" aria-label="Choose highlight">
            {slides.map((item, index) => <button key={item.eyebrow} type="button" onClick={() => setActive(index)} aria-label={`Show highlight ${index + 1}`} aria-current={index === active} className={`h-1 w-5 transition-colors ${index === active ? 'bg-white' : 'bg-white/35 hover:bg-white/65'}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

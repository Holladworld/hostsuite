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
    const id = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(id);
  }, []);

  const slide = slides[active];

  return (
    <section aria-label="Website support highlights" className="relative z-10 bg-[#4A1F6B] text-white">
      <div className="mx-auto flex min-h-[54px] max-w-[1440px] items-center justify-between gap-3 px-5 py-2 sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <span className="hidden shrink-0 rounded-md bg-white/12 px-2.5 py-1 text-[9px] font-extrabold tracking-[0.13em] text-[#E8D8F5] sm:inline">{slide.eyebrow}</span>
          <p key={slide.title} className="truncate text-xs font-semibold sm:text-sm">{slide.title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <Link href={slide.href} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[10px] font-extrabold text-[#4A1F6B] transition-colors hover:bg-[#F2EAF8] sm:px-4 sm:text-[11px]">{slide.action}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
          <div className="hidden items-center gap-1.5 sm:flex" aria-label="Choose highlight">
            {slides.map((item, index) => <button key={item.eyebrow} type="button" onClick={() => setActive(index)} aria-label={`Show highlight ${index + 1}`} aria-current={index === active} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-5 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/75'}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

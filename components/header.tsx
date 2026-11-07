'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle, ArrowUpRight } from 'lucide-react';
import { BRAND, NAV_LINKS, waLink } from '@/lib/constants';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <motion.header initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }} className={`sticky top-0 z-40 w-full border-b border-[#D8CEC2] text-[#211C1A] transition-colors duration-300 ${scrolled ? 'bg-[#F8F5EF]/95 shadow-sm backdrop-blur-xl' : 'bg-[#F3EEE5]'}`}>
        <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-9 lg:px-16 xl:px-24">
          <Link href="/" className="group flex items-center gap-3" aria-label="HostSuite home">
            <span className="font-display text-[1.9rem] font-semibold tracking-[-0.08em]">host<span className="text-[#A96549]">suite</span></span>
            <span className="hidden h-7 w-px bg-[#CFC2B5] sm:block" />
            <span className="hidden text-[9px] font-semibold uppercase leading-[1.55] tracking-[0.16em] text-[#82766B] sm:block">Website care<br />&amp; management</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} scroll className="text-[12px] font-semibold text-[#625951] transition-colors hover:text-[#A96549]">{link.label}</Link>)}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/portal" className="hidden text-[12px] font-semibold text-[#625951] hover:text-[#A96549] sm:inline">Customer sign in</Link>
            <Link href="/#diagnostic" className="hidden min-h-11 items-center gap-3 bg-[#211C1A] px-5 text-[11px] font-semibold text-[#F8F3EB] transition-colors hover:bg-[#87533F] sm:inline-flex">Get website help <ArrowUpRight className="h-4 w-4" /></Link>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-[#211C1A] hover:bg-[#E8DFD4] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && <>
          <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#211C1A]/55 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} className="fixed right-0 top-0 z-[60] flex h-full w-80 max-w-[88%] flex-col bg-[#F8F5EF] p-6 shadow-2xl lg:hidden" aria-label="Mobile navigation">
            <div className="flex items-center justify-between border-b border-[#D8CEC2] pb-5"><span className="font-display text-2xl font-semibold">Menu</span><button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center hover:bg-[#E8DFD4]" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            <nav className="mt-5 flex flex-col">{NAV_LINKS.map((link) => <Link key={link.href} href={link.href} scroll onClick={() => setMobileOpen(false)} className="border-b border-[#D8CEC2] py-4 text-base font-semibold text-[#302823] hover:text-[#A96549]">{link.label}</Link>)}<Link href="/portal" onClick={() => setMobileOpen(false)} className="border-b border-[#D8CEC2] py-4 text-base font-semibold text-[#302823] hover:text-[#A96549]">Customer sign in</Link></nav>
            <div className="mt-auto space-y-3">
              <Link href="/#diagnostic" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center bg-[#211C1A] text-sm font-semibold text-white">Get website help</Link>
              <a href={waLink('Hello HostSuite, I need help with my existing website.')} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 border border-[#CFC2B5] text-sm font-semibold text-[#87533F]"><MessageCircle className="h-4 w-4" /> Talk to us</a>
              <p className="pt-2 text-center text-[9px] uppercase tracking-[0.16em] text-[#82766B]">By {BRAND.parent}</p>
            </div>
          </motion.aside>
        </>}
      </AnimatePresence>
    </>
  );
}

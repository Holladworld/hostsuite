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
      <motion.header initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className={`sticky top-0 z-40 w-full border-b border-[#E8E1EF] text-[#251B31] transition-colors duration-300 ${scrolled ? 'bg-white/95 shadow-[0_5px_24px_rgba(47,25,65,0.07)] backdrop-blur-xl' : 'bg-white'}`}>
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="HostSuite home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A1F6B] text-lg font-extrabold tracking-[-0.08em] text-white shadow-[0_5px_12px_rgba(74,31,107,0.2)]">H</span>
            <span className="font-display text-[1.75rem] font-bold tracking-[-0.065em] text-[#281936]">Host<span className="text-[#67339A]">Suite</span></span>
            <span className="hidden border-l border-[#E5DCEB] pl-3 text-[10px] font-semibold leading-[1.45] text-[#766B80] sm:block">Website care<br />made simple</span>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} scroll className="text-[13px] font-semibold text-[#5E5368] transition-colors hover:text-[#67339A]">{link.label}</Link>)}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/portal" className="hidden rounded-lg px-3 py-2 text-[12px] font-semibold text-[#5E5368] transition-colors hover:bg-[#F5F0F8] hover:text-[#4A1F6B] sm:inline">Sign in</Link>
            <Link href="/#diagnostic" className="hidden min-h-11 items-center gap-2 rounded-xl bg-[#4A1F6B] px-5 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(74,31,107,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#5D2A86] hover:shadow-[0_8px_20px_rgba(74,31,107,0.24)] sm:inline-flex">Get website help <ArrowUpRight className="h-4 w-4" /></Link>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#4A1F6B] transition-colors hover:bg-[#F2ECF7] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && <>
          <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#21152D]/50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} className="fixed right-0 top-0 z-[60] flex h-full w-80 max-w-[88%] flex-col bg-white p-6 shadow-2xl lg:hidden" aria-label="Mobile navigation">
            <div className="flex items-center justify-between border-b border-[#E8E1EF] pb-5">
              <span className="font-display text-2xl font-bold text-[#4A1F6B]">HostSuite menu</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F2ECF7]" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="mt-5 flex flex-col">
              {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} scroll onClick={() => setMobileOpen(false)} className="border-b border-[#EEE8F2] py-4 text-base font-semibold text-[#382A45] hover:text-[#67339A]">{link.label}</Link>)}
              <Link href="/portal" onClick={() => setMobileOpen(false)} className="border-b border-[#EEE8F2] py-4 text-base font-semibold text-[#382A45] hover:text-[#67339A]">Customer sign in</Link>
            </nav>
            <div className="mt-auto space-y-3">
              <Link href="/#diagnostic" onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#4A1F6B] text-sm font-bold text-white">Get website help <ArrowUpRight className="h-4 w-4" /></Link>
              <a href={waLink('Hello HostSuite, I need help with my existing website.')} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCCFE7] text-sm font-semibold text-[#4A1F6B]"><MessageCircle className="h-4 w-4" /> Talk to our team</a>
              <p className="pt-2 text-center text-[9px] uppercase tracking-[0.14em] text-[#8A7E93]">By {BRAND.parent}</p>
            </div>
          </motion.aside>
        </>}
      </AnimatePresence>
    </>
  );
}

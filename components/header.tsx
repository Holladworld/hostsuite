'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND, waLink } from '@/lib/constants';

const navigation = [
  { label: 'What we look after', href: '/#services' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Plans', href: '/#pricing' },
  { label: 'About', href: '/about' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 w-full border-b border-[#E9E3DB] bg-[#F8F5EF]/95 text-[#201B20] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[78px] max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-16 xl:px-24">
          <Link href="/" className="group flex items-center gap-3" aria-label="HostSuite home">
            <span className="font-display text-[1.9rem] font-bold tracking-[-0.08em] text-[#211A20]">host<span className="text-[#875B4A]">suite</span></span>
            <span className="hidden h-7 w-px bg-[#D7CEC3] sm:block" />
            <span className="hidden font-body text-[9px] font-semibold uppercase leading-[1.5] tracking-[0.16em] text-[#8C8179] sm:block">Website care<br />& management</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-[13px] font-semibold text-[#5C5552] transition-colors hover:text-[#875B4A]">{item.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/portal" className="hidden text-[13px] font-semibold text-[#5C5552] transition-colors hover:text-[#875B4A] sm:inline">Sign in</Link>
            <Button asChild size="sm" className="hidden h-11 rounded-none bg-[#211A20] px-5 text-[12px] font-bold text-white hover:bg-[#875B4A] sm:inline-flex">
              <Link href="/#diagnostic" className="gap-2">Get website help <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-[#211A20] hover:bg-[#EEE8E0] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 cursor-default bg-[#160D1D]/55 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} className="fixed right-0 top-0 z-[60] flex h-full w-80 max-w-[88%] flex-col bg-[#F8F5EF] p-6 shadow-2xl lg:hidden" aria-label="Mobile navigation">
              <div className="flex items-center justify-between border-b border-[#E5DFE8] pb-5">
                <span className="font-display text-2xl font-bold text-[#211A20]">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center hover:bg-[#EEE8F0]" aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <nav className="mt-5 flex flex-col">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} scroll onClick={() => setMobileOpen(false)} className="border-b border-[#E5DFE8] py-4 text-base font-semibold text-[#35243D] hover:text-[#875B4A]">{item.label}</Link>
                ))}
                <Link href="/portal" onClick={() => setMobileOpen(false)} className="border-b border-[#E5DFE8] py-4 text-base font-semibold text-[#35243D] hover:text-[#875B4A]">Customer sign in</Link>
              </nav>
              <div className="mt-auto space-y-3">
                <Button asChild className="h-12 w-full rounded-none bg-[#211A20] text-white hover:bg-[#875B4A]">
                  <Link href="/#diagnostic" onClick={() => setMobileOpen(false)}>Get website help</Link>
                </Button>
                <a href={waLink('Hello HostSuite, I need help with my existing website.')} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 border border-[#CFC2D4] text-sm font-semibold text-[#4A1F6B]">
                  <MessageCircle className="h-4 w-4" /> Talk to us
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

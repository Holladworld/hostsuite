'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Menu, X, MessageCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND, NAV_LINKS, waLink } from '@/lib/constants';

function NavLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} scroll prefetch className="px-3 py-2 text-sm font-medium text-[#625868] transition-colors hover:text-[#4A1F6B]">
      {label}
    </Link>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sticky top-0 z-40 w-full border-b border-[#E5DFE8] bg-[#F8F6F1]/95 backdrop-blur-sm"
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-[#4A1F6B] text-white"><Server className="h-5 w-5" /></span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.65rem] font-normal tracking-tight text-[#24132F]">HostSuite</span>
              <span className="mt-1 font-mono-data text-[9px] uppercase tracking-[0.15em] text-[#8A7D8F]">by {BRAND.parent}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => <NavLink key={link.href} href={link.href} label={link.label} />)}
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="hidden h-10 rounded-none bg-[#4A1F6B] px-5 text-white hover:bg-[#351449] sm:inline-flex">
              <Link href="/portal?mode=signup" className="gap-2">Get started <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center text-[#24132F] hover:bg-[#EEE8F0] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button type="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 cursor-default bg-[#160D1D]/55 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 240 }} className="fixed right-0 top-0 z-[60] flex h-full w-80 max-w-[88%] flex-col bg-[#F8F6F1] p-6 shadow-2xl lg:hidden" aria-label="Mobile navigation">
              <div className="flex items-center justify-between border-b border-[#E5DFE8] pb-5">
                <span className="font-display text-2xl text-[#24132F]">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-10 w-10 items-center justify-center hover:bg-[#EEE8F0]" aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              <nav className="mt-5 flex flex-col">
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} scroll onClick={() => setMobileOpen(false)} className="border-b border-[#E5DFE8] py-4 text-base font-medium text-[#35243D] hover:text-[#4A1F6B]">{link.label}</Link>
                ))}
              </nav>
              <div className="mt-auto space-y-3">
                <Button asChild className="h-12 w-full rounded-none bg-[#4A1F6B] text-white hover:bg-[#351449]">
                  <Link href="/portal?mode=signup" onClick={() => setMobileOpen(false)}>Create an account</Link>
                </Button>
                <a href={waLink('Hello HostSuite, I need help with my business technology.')} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 border border-[#CFC2D4] text-sm font-semibold text-[#4A1F6B]">
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

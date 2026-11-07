import Link from 'next/link';
import { Server, Mail, MessageCircle, ArrowUpRight, Instagram as InstagramIcon } from 'lucide-react';
import { BRAND, SOCIAL_LINKS, waLink } from '@/lib/constants';

const footerServices = [
  { label: 'Website management', href: '/#services' },
  { label: 'Access recovery', href: '/services#emergency-recovery' },
  { label: 'Business email help', href: '/services#email-deliverability' },
  { label: 'Website migration', href: '/services#zero-downtime-migration' },
];

const footerCompany = [
  { label: 'About HostSuite', href: '/about' },
  { label: 'Knowledge Center', href: '/knowledge' },
  { label: 'Blog & Guides', href: '/blog' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Customer portal', href: '/portal' },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-[#21132F] text-[#F7F1FA]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.3fr_0.8fr_0.9fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-white font-display text-2xl text-[#4A1F6B]">H</span>
              <span className="font-display text-3xl font-normal tracking-tight">HostSuite</span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-white/65">
              Your website, looked after. Practical help, ongoing care and a team to call when the technical work gets in the way.
            </p>
            <p className="mt-3 font-mono-data text-[10px] uppercase tracking-[0.14em] text-white/40">A {BRAND.parent} product</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/20 px-3 py-2 text-xs text-white/70 transition hover:border-white/50 hover:text-white" aria-label={`${social.label}: ${social.handle}`}>
                  <SocialIcon label={social.label} /> {social.label} <ArrowUpRight className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-white/45">Website help</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {footerServices.map((link) => <li key={link.href}><Link href={link.href} className="text-white/65 transition hover:text-white">{link.label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h2 className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-white/45">HostSuite</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {footerCompany.map((link) => <li key={link.href}><Link href={link.href} className="text-white/65 transition hover:text-white">{link.label}</Link></li>)}
              <li><Link href="/terms" className="text-white/65 transition hover:text-white">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-white/65 transition hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="font-mono-data text-[10px] uppercase tracking-[0.16em] text-white/45">Talk to a person</h2>
            <a href={waLink('Hello HostSuite, I need help with my existing website.')} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-start gap-3 border border-white/15 p-4 transition hover:border-white/40">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#C7A9D6]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">WhatsApp support</span>
                <span className="mt-1 block text-xs text-white/55">{BRAND.whatsappDisplay}</span>
              </span>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-white/50" />
            </a>
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-4 flex items-start gap-3 break-all text-sm text-white/65 transition hover:text-white">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" /> {BRAND.supportEmail}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Vobels Limited. All rights reserved.</p>
          <p>Keep your website. Keep control. Get the help you need.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label }: { label: string }) {
  if (label === 'TikTok') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.54c.3 0 .6.04.88.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" /></svg>;
  if (label === 'Instagram') return <InstagramIcon className="h-4 w-4" />;
  return null;
}

import Link from 'next/link';
import { Server, Mail, MessageCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { BRAND, FOOTER_LINKS, SOCIAL_LINKS, waLink } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-black text-background">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.04]" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:pr-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Server className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight">HostSuite</span>
            </Link>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-2.5 py-1 text-[11px] font-medium text-background/80">
                by Vobels Limited
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              Managed Web Infrastructure &amp; Fractional Developer Operations.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 rounded-lg border border-background/15 bg-background/5 px-3 py-2 text-xs font-medium text-background/70 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-background"
                  aria-label={`${social.label}: ${social.handle}`}
                >
                  <SocialIcon label={social.label} />
                  <span>{social.label}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-background/90">
              Solutions &amp; Services
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.Solutions.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll className="text-background/60 transition-colors hover:text-background">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-background/90">
              Resources &amp; Company
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {FOOTER_LINKS.Company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} scroll className="text-background/60 transition-colors hover:text-background">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-background/90">
              Emergency Ops Desk
            </h4>
            <div className="mt-4 space-y-4">
              <a
                href={waLink('Hello HostSuite, I need emergency infrastructure help.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/15 px-4 py-3 text-sm font-semibold text-background transition-all hover:border-primary/50 hover:bg-primary/25"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex min-w-0 flex-col">
                  <span>WhatsApp Emergency Desk</span>
                  <span className="text-xs font-normal text-background/50">{BRAND.whatsappDisplay}</span>
                </div>
              </a>

              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="flex min-w-0 items-start gap-3 text-sm text-background/60 transition-colors hover:text-background"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-background/40" />
                <span className="break-all">{BRAND.supportEmail}</span>
              </a>

              <div className="flex items-center gap-3 rounded-lg border border-background/10 bg-background/5 px-4 py-2.5">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-background/90">Lagos Node — Operational</span>
                  <span className="text-[11px] text-background/50">99.99% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 sm:flex-row">
          <p className="text-center text-xs text-background/50 sm:text-left">
            &copy; 2026 Vobels Limited. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {FOOTER_LINKS.Legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-background/50 transition-colors hover:text-background/80"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-background/40">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>SSL Secured</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label }: { label: string }) {
  if (label === 'TikTok') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.73 2.89 2.89 0 0 1 2.31-4.54c.3 0 .6.04.88.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
      </svg>
    );
  }
  if (label === 'Instagram') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.81 3.81 0 0 1-1.38-.9 3.81 3.81 0 0 1-.9-1.38c-.16-.42-1.06-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.11 1.38C1.37 2.67.95 3.34.65 4.13c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.11.65.66 1.32 1.08 2.11 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.11-1.38 5.86 5.86 0 0 0 1.38-2.11c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.11A5.86 5.86 0 0 0 19.87.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.41-10.16a1.44 1.44 0 1 0 1.44 1.44 1.44 0 0 0-1.44-1.44z" />
      </svg>
    );
  }
  return null;
}

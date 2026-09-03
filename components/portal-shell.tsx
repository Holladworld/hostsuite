'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, Globe, HelpCircle, Home, Mail, Server, Settings, Sparkles, WandSparkles } from 'lucide-react';

const items = [
  { href: '/portal/dashboard', label: 'Overview', icon: Home },
  { href: '/portal/hosting', label: 'Hosting', icon: Server },
  { href: '/portal/domains', label: 'Domains', icon: Globe },
  { href: '/portal/email', label: 'Business email', icon: Mail },
  { href: '/portal/websites', label: 'Websites', icon: WandSparkles },
  { href: '/portal/website-builder', label: 'AI website builder', icon: Sparkles },
  { href: '/portal/billing', label: 'Billing', icon: CreditCard },
  { href: '/portal/support', label: 'Support', icon: HelpCircle },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = pathname === '/portal' || pathname === '/portal/';
  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/portal/dashboard" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/portal/dashboard' && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="h-4 w-4 shrink-0" />{label}</Link>;
          })}
        </nav>
        <div className="border-t p-3"><Link href="/portal/support" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-4 w-4 shrink-0" />Account & support</Link></div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">{children}</div>

      <nav aria-label="Portal navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="flex overflow-x-auto overscroll-contain px-1 pb-[env(safe-area-inset-bottom)]">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/portal/dashboard' && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-w-[76px] shrink-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-medium transition ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-[92px] truncate whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

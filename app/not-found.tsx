'use client';

import Link from 'next/link';
import { Server, Home, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND, waLink } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Server className="h-8 w-8" />
        </div>

        <p className="font-mono-data text-6xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The infrastructure route you are looking for does not exist. It may have been moved, migrated, or was never provisioned.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" /> Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a
              href={waLink('Hello HostSuite, I encountered a 404 error on your website and need help.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Emergency Desk
            </a>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          A {BRAND.parent} product
        </p>
      </div>
    </div>
  );
}

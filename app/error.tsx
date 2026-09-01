'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND, waLink } from '@/lib/constants';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[HostSuite] Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-destructive/10 blur-3xl" aria-hidden />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <p className="font-mono-data text-6xl font-bold text-destructive">500</p>
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          System Error Encountered
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Our ops team has been alerted. We are already investigating. Please try again or reach our emergency desk.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <a
              href={waLink('Hello HostSuite, I encountered a system error (500) on your website and need help.')}
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

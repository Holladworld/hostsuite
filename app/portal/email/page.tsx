'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BusinessEmailPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to portal
          </Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Business email</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Give your business a professional email address.</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">HostSuite will eventually let you manage business mailboxes alongside your domain and website. For now, this page explains the service without pretending mailbox provisioning is connected.</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div><CardTitle className="mt-3">If you already have a domain</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-6 text-muted-foreground">You can start with your existing domain. Provider-specific mailbox setup will be connected once the email provider and reseller capabilities are verified.</p><Button asChild className="mt-5 gap-2"><Link href="/get-started">Get started <ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
          </Card>

          <Card>
            <CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></div><CardTitle className="mt-3">If you do not have a domain</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-6 text-muted-foreground">That is okay. A professional business email normally starts with a domain, so HostSuite can guide you through the domain-first setup rather than asking you to figure it out yourself.</p><Button asChild variant="outline" className="mt-5 gap-2"><Link href="/get-started">Set up my business <ArrowRight className="h-4 w-4" /></Link></Button></CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="p-5 sm:p-6">
            <p className="font-semibold">Provider integration is not connected yet.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">This milestone does not create mailboxes, change DNS records, send credentials, or claim that an email account has been provisioned. Those actions will be added only after the actual provider capabilities are verified.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

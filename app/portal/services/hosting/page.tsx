'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Server, ShieldCheck, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = ['Website hosting account', 'Control-panel access when supported by the provider', 'DNS and domain connection guidance', 'Usage and service status visibility'];

export default function HostingServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/portal/services" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Services</Link><Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link></div></header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl"><p className="text-sm font-medium text-primary">Hosting</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Get hosting for your website</h1><p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">This is the customer service entry point. Your hosting account will appear under Manage Hosting after a real provider-backed order has been provisioned.</p></div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <Card><CardHeader><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Server className="h-5 w-5" /></div><CardTitle className="mt-3">What HostSuite manages</CardTitle></CardHeader><CardContent><ul className="space-y-3">{features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}</ul><div className="mt-6 rounded-xl border border-border bg-muted/30 p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="text-sm font-medium">Provider-backed provisioning</p><p className="mt-1 text-xs leading-5 text-muted-foreground">HostSuite will only show a hosting service as active after the provider confirms provisioning. We will not simulate an account, credentials or control-panel URL.</p></div></div></div></CardContent></Card>

          <Card><CardHeader><CardTitle>Choose how you want to proceed</CardTitle></CardHeader><CardContent className="space-y-3"><Button asChild className="h-auto w-full justify-between p-4"><Link href="/portal/support"><span className="flex items-center gap-2"><LifeBuoy className="h-4 w-4" /> Ask HostSuite to set it up</span><ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="h-auto w-full justify-between p-4"><Link href="/portal/hosting"><span className="flex items-center gap-2"><Server className="h-4 w-4" /> View my hosting</span><ArrowRight className="h-4 w-4" /></Link></Button><div className="rounded-xl border border-border p-4"><div className="flex gap-2"><CircleHelp className="mt-0.5 h-4 w-4 text-muted-foreground" /><p className="text-xs leading-5 text-muted-foreground">Pricing and provider packages will be loaded from the configured provider/pricing layer rather than hardcoded into this page.</p></div></div></CardContent></Card>
        </div>
      </main>
    </div>
  );
}

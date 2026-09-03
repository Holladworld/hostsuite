'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Activity, Globe, HardDrive, Mail, Server, WandSparkles, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const services = [
  { key: 'hosting', name: 'Website Hosting', description: 'Buy hosting or manage an existing hosting service.', icon: Server, href: '/portal/services/hosting', manageHref: '/portal/hosting' },
  { key: 'domain', name: 'Domain', description: 'Register a new domain or manage a domain already connected to HostSuite.', icon: Globe, href: '/portal/services/domain', manageHref: '/portal/domains' },
  { key: 'email', name: 'Business Email', description: 'Set up professional mailboxes for your business domain.', icon: Mail, href: '/portal/services/email', manageHref: '/portal/email' },
  { key: 'website', name: 'Website', description: 'Build, publish or manage your business website.', icon: Globe, href: '/portal/website-builder', manageHref: '/portal/websites' },
  { key: 'ai', name: 'AI Website Builder', description: 'Create a website with guided AI assistance.', icon: WandSparkles, href: '/portal/website-builder', manageHref: '/portal/website-builder' },
  { key: 'monitoring', name: 'Monitoring', description: 'Keep an eye on availability, SSL and supported infrastructure.', icon: Activity, href: '/portal/monitoring', manageHref: '/portal/monitoring' },
  { key: 'backup', name: 'Backups', description: 'Protect website data and get recovery support.', icon: HardDrive, href: '/portal/backups', manageHref: '/portal/backups' },
];

export default function PortalServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Services</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Buy or manage a service</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">You are already in your workspace. Choose a service directly — you do not need to go through the public “Get Started” flow again.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ key, name, description, icon: Icon, href, manageHref }) => (
            <Card key={key} className="flex flex-col">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <CardTitle className="mt-3">{name}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex gap-2">
                <Button asChild className="flex-1 gap-1.5"><Link href={href}>Buy / set up <ArrowRight className="h-4 w-4" /></Link></Button>
                <Button asChild variant="outline"><Link href={manageHref}>Manage</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-3"><LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Want a human to handle it?</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Ask HostSuite for help instead of choosing a service yourself.</p></div></div>
            <Button asChild variant="outline"><Link href="/portal/support">Ask HostSuite</Link></Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, CreditCard, Globe, Headphones, LayoutDashboard, Palette, Server, Settings, ShieldCheck, Sparkles, Users, Wrench } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const operations = [
  ['Customers', 'Manage customer accounts and services.', Users],
  ['Services', 'View and manage customer service subscriptions.', Server],
  ['Domains', 'Review domains, renewals and DNS-related work.', Globe],
  ['Hosting', 'Manage hosting services and provider connections.', Server],
  ['Websites', 'Manage website projects and deployment targets.', LayoutDashboard],
  ['Business email', 'Manage email services and customer requests.', Headphones],
  ['Support', 'Review tickets and technical requests.', Headphones],
  ['Incidents', 'Track outages and urgent technical work.', ShieldCheck],
  ['Payments', 'Review payments and billing activity.', CreditCard],
  ['Renewals', 'See services approaching renewal.', CreditCard],
  ['Monitoring', 'Review website and infrastructure health.', ShieldCheck],
  ['AI builder', 'Review website-builder activity and usage.', Sparkles],
  ['Managed customers', 'See customers who ask HostSuite to handle their infrastructure.', Wrench],
];

const cms = [
  ['Branding', 'Change logo, favicon, support details and approved visual settings.', Palette],
  ['Pricing', 'Create, edit, reorder and deactivate public pricing plans.', CreditCard],
  ['Blog', 'Create drafts, publish posts, edit content and manage featured images.', BookOpen],
  ['Site settings', 'Manage basic public website configuration without changing code.', Settings],
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><div><p className="font-display text-lg font-bold tracking-tight">HostSuite Admin</p><p className="text-xs text-muted-foreground">Operations & content management</p></div><Link href="/portal/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Customer portal <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div><p className="text-sm font-medium text-primary">Control centre</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Run HostSuite without opening the codebase</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Operations, customers, services and the basic public-site content should be manageable here. Provider-specific actions remain behind integrations.</p></div>
        <section className="mt-8"><div className="mb-4"><h2 className="font-display text-xl font-semibold">Operations</h2><p className="mt-1 text-sm text-muted-foreground">The information and workflows you need to run the service.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{operations.map(([name, description, Icon]) => { const IconComponent = Icon as typeof Users; return <Card key={name as string} className="transition-colors hover:border-primary/40"><CardHeader className="pb-3"><IconComponent className="h-5 w-5 text-primary" /><CardTitle className="mt-2 text-base">{name as string}</CardTitle><CardDescription>{description as string}</CardDescription></CardHeader><CardContent><button className="text-sm font-medium text-primary">Open <ArrowRight className="ml-1 inline h-4 w-4" /></button></CardContent></Card>; })}</div></section>
        <section className="mt-10"><div className="mb-4"><h2 className="font-display text-xl font-semibold">Website CMS</h2><p className="mt-1 text-sm text-muted-foreground">Basic changes should not require a deployment or a code edit.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cms.map(([name, description, Icon]) => { const IconComponent = Icon as typeof Palette; return <Card key={name as string} className="border-primary/15"><CardHeader className="pb-3"><IconComponent className="h-5 w-5 text-primary" /><CardTitle className="mt-2 text-base">{name as string}</CardTitle><CardDescription>{description as string}</CardDescription></CardHeader><CardContent><button className="text-sm font-medium text-primary">Manage <ArrowRight className="ml-1 inline h-4 w-4" /></button></CardContent></Card>; })}</div></section>
        <Card className="mt-8 border-primary/20 bg-primary/5"><CardContent className="flex gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold">Admin safety boundary</p><p className="mt-1 text-sm leading-6 text-muted-foreground">This dashboard is the control surface. It should never expose provider secrets or let an administrator bypass customer ownership rules. Real write actions will be connected to authenticated admin APIs as each module is completed.</p></div></CardContent></Card>
      </main>
    </div>
  );
}

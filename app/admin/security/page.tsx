'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SECURITY_CONTROLS, isProductionReady, type SecurityControl } from '@/lib/security';

const statusLabel: Record<SecurityControl['status'], string> = {
  planned: 'Planned',
  review: 'Requires review',
  implemented: 'Implemented',
  needs_attention: 'Needs attention',
};

export default function AdminSecurityPage() {
  const ready = isProductionReady();
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border"><div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Admin</Link></div></header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-3"><LockKeyhole className="h-6 w-6 text-primary" /></div><div><p className="text-sm font-medium text-primary">Production security</p><h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Security control centre</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A checklist for the controls that must be verified before HostSuite handles real customer infrastructure and payments.</p></div></div>
        <Card className="mt-8 border-primary/20"><CardContent className="flex items-start gap-3 p-5">{ready ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <CircleAlert className="mt-0.5 h-5 w-5 text-primary" />}<div><p className="font-semibold">{ready ? 'All controls marked implemented' : 'Not production-ready yet'}</p><p className="mt-1 text-sm text-muted-foreground">Controls are intentionally not marked implemented until they have been verified against the actual application and infrastructure.</p></div></CardContent></Card>
        <div className="mt-8 space-y-3">{SECURITY_CONTROLS.map((control) => <Card key={control.id}><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><p className="font-medium">{control.name}</p>{control.required && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">Required</span>}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{control.description}</p></div><span className="w-fit rounded-full border border-border px-2.5 py-1 text-xs">{statusLabel[control.status]}</span></div></CardContent></Card>)}</div>
      </main>
    </div>
  );
}

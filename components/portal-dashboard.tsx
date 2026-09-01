'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server,
  Globe,
  ShieldCheck,
  Lock,
  Activity,
  Mail,
  Database,
  FileText,
  Plus,
  Loader2,
  LogOut,
  MessageCircle,
  Ticket,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  HardDriveDownload,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase, useAuth } from '@/lib/supabase-client';
import { BRAND, waLink, PRICING } from '@/lib/constants';
import { formatNaira } from '@/lib/format';
import type { DomainRow, TicketRow, TicketType, DomainStatus, PlanTier } from '@/lib/types';
import { toast } from 'sonner';
import Link from 'next/link';

const statusConfig: Record<DomainStatus, { label: string; className: string; dot: string }> = {
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/30', dot: 'bg-success' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/10 text-warning border-warning/30', dot: 'bg-warning' },
  backup_complete: { label: 'Backed Up', className: 'bg-secondary/10 text-secondary border-secondary/30', dot: 'bg-secondary' },
  security_clean: { label: 'Security Clean', className: 'bg-info/10 text-info border-info/30', dot: 'bg-info' },
  expiring: { label: 'Expiring', className: 'bg-destructive/10 text-destructive border-destructive/30', dot: 'bg-destructive' },
};

const ticketTypeConfig: Record<TicketType, { label: string; icon: React.ElementType }> = {
  text_update: { label: 'Text Update', icon: FileText },
  email_setup: { label: 'Email Setup', icon: Mail },
  database_backup: { label: 'Database Backup', icon: Database },
  downtime: { label: 'Downtime', icon: WifiOff },
  migration: { label: 'Migration', icon: HardDriveDownload },
  other: { label: 'Other', icon: Ticket },
};

const ticketStatusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-info/10 text-info border-info/30' },
  in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/30' },
  resolved: { label: 'Resolved', className: 'bg-success/10 text-success border-success/30' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
};

const REQUEST_TYPES: { value: TicketType; label: string; icon: React.ElementType }[] = [
  { value: 'text_update', label: 'Text / Content Update', icon: FileText },
  { value: 'email_setup', label: 'Email Issue', icon: Mail },
  { value: 'downtime', label: 'Downtime / Down Site', icon: WifiOff },
  { value: 'database_backup', label: 'Database Backup', icon: Database },
  { value: 'migration', label: 'Migration', icon: HardDriveDownload },
  { value: 'other', label: 'Other Request', icon: Ticket },
];

const PLAN_LABEL: Record<PlanTier, string> = {
  starter_ops: 'Starter',
  managed_growth: 'Growth',
  enterprise: 'Enterprise',
};

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function PortalDashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'domains' | 'tickets'>('overview');
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    request_type: 'text_update' as TicketType,
    domain: '',
    subject: '',
    details: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const [domRes, tickRes] = await Promise.all([
      supabase.from('domains').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setDomains((domRes.data as DomainRow[]) ?? []);
    setTickets((tickRes.data as TicketRow[]) ?? []);
    setDataLoading(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/portal');
      return;
    }
    if (user) {
      loadData();
    }
  }, [loading, user, loadData, router]);

  async function handleSignOut() {
    await signOut();
    router.push('/portal');
  }

  async function submitTicket() {
    if (!user) return;
    if (!ticketForm.subject.trim()) {
      toast.error('Add a short subject for your request.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        request_type: ticketForm.request_type,
        domain: ticketForm.domain || null,
        subject: ticketForm.subject,
        details: ticketForm.details || null,
        priority: ticketForm.request_type === 'downtime' ? 'high' : 'normal',
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error('Could not create your ticket. Try again.');
      return;
    }
    setTickets((prev) => [data as TicketRow, ...prev]);
    setTicketForm({ request_type: 'text_update', domain: '', subject: '', details: '' });
    setTicketOpen(false);
    toast.success('Ticket created. Our engineers have been notified.');
    setActiveTab('tickets');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const activePlan = domains[0]?.plan_tier ?? 'managed_growth';
  const plan = PRICING.find((p) => p.id === activePlan);
  const planLabel = PLAN_LABEL[activePlan];
  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Portal top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Server className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-bold tracking-tight">HostSuite</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Client Portal</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your hosted domains, request fixes, and track your SLA.
            </p>
          </div>
          <Button
            onClick={() => setTicketOpen(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Open Support Ticket
          </Button>
        </motion.div>

        {/* Stat cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe, label: 'Hosted Domains', value: domains.length, accent: 'text-primary' },
            { icon: ShieldCheck, label: 'SSL Active', value: domains.filter((d) => d.ssl_active).length, accent: 'text-success' },
            { icon: Activity, label: 'Avg Uptime', value: domains.length ? `${(domains.reduce((s, d) => s + Number(d.uptime_pct), 0) / domains.length).toFixed(2)}%` : '—', accent: 'text-secondary' },
            { icon: Ticket, label: 'Open Tickets', value: openTickets, accent: 'text-warning' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
                <p className="mt-3 font-mono-data text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* SLA banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-background p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current SLA Tier</p>
              <p className="font-display text-lg font-bold text-foreground">{planLabel}</p>
              {plan && plan.monthly !== null && (
                <p className="text-xs text-muted-foreground">{formatNaira(plan.monthly)}/mo · Priority WhatsApp SLA</p>
              )}
            </div>
          </div>
          <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <a href={waLink(`Hello HostSuite, this is ${user.email}. I need emergency dispatch assistance.`)} target="_blank" rel="noopener noreferrer" className="gap-2">
              <MessageCircle className="h-4 w-4" /> Emergency WhatsApp Dispatch
            </a>
          </Button>
        </motion.div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 rounded-lg border border-border bg-card p-1">
          {([
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'domains', label: 'Domains', icon: Globe },
            { id: 'tickets', label: 'Support Tickets', icon: Ticket },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {dataLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="grid gap-5 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold">Recent Domains</h3>
                        <button onClick={() => setActiveTab('domains')} className="text-xs font-medium text-primary hover:underline">
                          View all
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {domains.slice(0, 3).map((d) => {
                          const s = statusConfig[d.status];
                          return (
                            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-3">
                              <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-primary" />
                                <div>
                                  <p className="font-mono-data text-sm font-medium text-foreground">{d.domain}</p>
                                  <p className="text-xs text-muted-foreground">{PLAN_LABEL[d.plan_tier]}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={s.className}>
                                <span className={`mr-1 h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.label}
                              </Badge>
                            </div>
                          );
                        })}
                        {domains.length === 0 && (
                          <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <Globe className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No domains currently connected. Open a support ticket or contact our onboarding team to link your infrastructure.</p>
                            <div className="flex gap-2">
                              <Button onClick={() => setTicketOpen(true)} size="sm" variant="outline">Open Ticket</Button>
                              <Button asChild size="sm" variant="outline">
                                <a href={waLink(`Hello HostSuite, this is ${user?.email}. I need help connecting my domain.`)} target="_blank" rel="noopener noreferrer">WhatsApp Onboarding</a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-semibold">Recent Tickets</h3>
                        <button onClick={() => setActiveTab('tickets')} className="text-xs font-medium text-primary hover:underline">
                          View all
                        </button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {tickets.slice(0, 3).map((t) => {
                          const s = ticketStatusConfig[t.status];
                          return (
                            <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-3">
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-secondary" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">{t.subject}</p>
                                  <p className="text-xs text-muted-foreground">{ticketTypeConfig[t.request_type].label} · {timeAgo(t.created_at)}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={s.className}>{s.label}</Badge>
                            </div>
                          );
                        })}
                        {tickets.length === 0 && (
                          <p className="py-6 text-center text-sm text-muted-foreground">No tickets yet. Open a ticket to get started.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <h3 className="font-display text-base font-semibold">Quick Actions</h3>
                      <div className="mt-4 space-y-2">
                        <Button onClick={() => setTicketOpen(true)} variant="outline" className="w-full justify-start gap-2">
                          <Plus className="h-4 w-4" /> Open Support Ticket
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start gap-2">
                          <a href={waLink(`Hello HostSuite, this is ${user.email}. I need help.`)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="h-4 w-4" /> WhatsApp Engineer
                          </a>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start gap-2">
                          <a href={`mailto:${BRAND.supportEmail}`}>
                            <Mail className="h-4 w-4" /> Email Support
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <h3 className="font-display text-base font-semibold text-foreground">SLA Status</h3>
                      </div>
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Response Time</span>
                          <span className="font-mono-data font-medium text-foreground">{activePlan === 'enterprise' ? '< 1 hr' : activePlan === 'managed_growth' ? '< 2 hrs' : '< 24 hrs'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Uptime SLA</span>
                          <span className="font-mono-data font-medium text-success">99.99%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Backups</span>
                          <span className="font-mono-data font-medium text-foreground">{activePlan === 'starter_ops' ? 'Weekly' : 'Daily'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* DOMAINS */}
              {activeTab === 'domains' && (
                <motion.div
                  key="domains"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <h3 className="font-display text-lg font-semibold">Your Hosted Domains</h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Domain</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Plan</th>
                          <th className="pb-3 pr-4 font-medium">SSL</th>
                          <th className="pb-3 pr-4 font-medium">Uptime</th>
                          <th className="pb-3 font-medium">Last Backup</th>
                        </tr>
                      </thead>
                      <tbody>
                        {domains.map((d) => {
                          const s = statusConfig[d.status];
                          return (
                            <tr key={d.id} className="border-b border-border/60 last:border-0">
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-2.5">
                                  <Globe className="h-4 w-4 text-primary" />
                                  <span className="font-mono-data font-medium text-foreground">{d.domain}</span>
                                </div>
                              </td>
                              <td className="py-3.5 pr-4">
                                <Badge variant="outline" className={s.className}>
                                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${s.dot}`} /> {s.label}
                                </Badge>
                              </td>
                              <td className="py-3.5 pr-4 text-muted-foreground">{PLAN_LABEL[d.plan_tier]}</td>
                              <td className="py-3.5 pr-4">
                                {d.ssl_active ? (
                                  <span className="flex items-center gap-1.5 text-success"><Lock className="h-3.5 w-3.5" /> Active</span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-destructive"><AlertCircle className="h-3.5 w-3.5" /> Inactive</span>
                                )}
                              </td>
                              <td className="py-3.5 pr-4 font-mono-data text-foreground">{Number(d.uptime_pct).toFixed(2)}%</td>
                              <td className="py-3.5 text-muted-foreground">{timeAgo(d.last_backup)}</td>
                            </tr>
                          );
                        })}
                        {domains.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-10 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <Globe className="h-8 w-8 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">No domains currently connected. Open a support ticket or contact our onboarding team to link your infrastructure.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* TICKETS */}
              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Support Tickets</h3>
                    <Button onClick={() => setTicketOpen(true)} size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-4 w-4" /> New Ticket
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {tickets.map((t) => {
                      const s = ticketStatusConfig[t.status];
                      const TypeIcon = ticketTypeConfig[t.request_type].icon;
                      return (
                        <div key={t.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{t.subject}</p>
                              <Badge variant="outline" className={s.className}>{s.label}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {ticketTypeConfig[t.request_type].label}{t.domain ? ` · ${t.domain}` : ''} · {timeAgo(t.created_at)}
                            </p>
                            {t.details && <p className="mt-2 text-sm text-muted-foreground">{t.details}</p>}
                          </div>
                        </div>
                      );
                    })}
                    {tickets.length === 0 && (
                      <div className="py-12 text-center">
                        <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
                        <p className="mt-3 text-sm text-muted-foreground">No tickets yet.</p>
                        <Button onClick={() => setTicketOpen(true)} size="sm" variant="outline" className="mt-4 gap-1.5">
                          <Plus className="h-4 w-4" /> Open Support Ticket
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="mt-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to homepage
          </Link>
        </div>
      </main>

      {/* Open Support Ticket modal */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center font-display">Open Support Ticket</DialogTitle>
            <DialogDescription className="text-center">
              Tell our engineers what you need. We will pick it up on WhatsApp too.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {REQUEST_TYPES.map((rt) => {
                  const Icon = rt.icon;
                  const active = ticketForm.request_type === rt.value;
                  return (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setTicketForm((f) => ({ ...f, request_type: rt.value }))}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium transition-all ${
                        active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {rt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-domain">Domain (optional)</Label>
              <Input
                id="ticket-domain"
                placeholder="company.com.ng"
                className="font-mono-data"
                value={ticketForm.domain}
                onChange={(e) => setTicketForm((f) => ({ ...f, domain: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="e.g. Update homepage banner text"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-details">Details</Label>
              <Textarea
                id="ticket-details"
                rows={4}
                placeholder="Describe what needs fixing, updating, or setting up..."
                value={ticketForm.details}
                onChange={(e) => setTicketForm((f) => ({ ...f, details: e.target.value }))}
              />
            </div>

            <Button
              onClick={submitTicket}
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Create Ticket</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  Inbox,
  Download,
  Loader2,
  Building2,
  Globe,
  Mail,
  MessageCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import { useAdminLeads } from '@/hooks/use-admin';
import { supabase } from '@/lib/supabase-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { LeadRow } from '@/lib/types';

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-info/10 text-info border-info/30' },
  contacted: { label: 'Contacted', className: 'bg-warning/10 text-warning border-warning/30' },
  won: { label: 'Converted', className: 'bg-success/10 text-success border-success/30' },
  lost: { label: 'Lost', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function AdminLeadsPanel() {
  const { leads, loading, load, updateLeadStatus, createLead } = useAdminLeads();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    company_name: '',
    domain_url: '',
    email: '',
    whatsapp: '',
    description: '',
  });
  const [adding, setAdding] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [conversionScope, setConversionScope] = useState('');
  const [conversionEmail, setConversionEmail] = useState('');
  const [conversionAmount, setConversionAmount] = useState('');
  const [converting, setConverting] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  async function handleSync() {
    setSyncing(true);
    await load();
    setSyncing(false);
    toast.success('Leads synced.');
  }

  async function handleAddLead() {
    if (!addForm.company_name && !addForm.email) {
      toast.error('Company name or email is required.');
      return;
    }
    setAdding(true);
    const result = await createLead({
      company_name: addForm.company_name || undefined,
      domain_url: addForm.domain_url || undefined,
      email: addForm.email || undefined,
      whatsapp: addForm.whatsapp || undefined,
      description: addForm.description || undefined,
      source: 'manual',
    });
    setAdding(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Manual lead added.');
      setAddOpen(false);
      setAddForm({ company_name: '', domain_url: '', email: '', whatsapp: '', description: '' });
    }
  }

  async function handleConvertLead(leadId: string) {
    if (!conversionScope.trim()) {
      toast.error('Enter the work scope agreed with the customer on WhatsApp.');
      return;
    }
    setConverting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.');
      const response = await fetch(`/api/admin/leads/${leadId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ agreedScope: conversionScope, quotedAmount: conversionAmount, customerEmail: conversionEmail }),
      });
      const result = await response.json() as { error?: string; ticketId?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not create the customer ticket.');
      toast.success('Diagnostic converted into a customer ticket.');
      setConvertingLeadId(null);
      setConversionScope('');
      setConversionEmail('');
      setConversionAmount('');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not convert this diagnostic.');
    } finally {
      setConverting(false);
    }
  }

  function exportLeads() {
    const headers = ['Date', 'Company', 'Domain', 'Email', 'WhatsApp', 'Pain Points', 'Description', 'Est. Cost', 'Status'];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString(),
      l.company_name ?? '',
      l.domain_url ?? '',
      l.email ?? '',
      l.whatsapp ?? '',
      (l.pain_points ?? []).join('; '),
      (l.description ?? '').replace(/"/g, "'"),
      l.estimated_cost_min && l.estimated_cost_max ? `${l.estimated_cost_min}-${l.estimated_cost_max}` : '',
      l.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hostsuite-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Inbox className="h-5 w-5 text-primary" /> Lead Inbox
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All diagnostic submissions from &quot;Tell Us Your Pain&quot;.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} variant="outline" size="sm" className="gap-2" disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Leads
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
          <Button onClick={exportLeads} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {['all', 'new', 'contacted', 'won', 'lost'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'All Leads' : f}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === 'all' ? leads.length : leads.filter((l) => l.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card py-16 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No leads in this filter.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20"
            >
              <button
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {lead.company_name || lead.domain_url || 'Unknown lead'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge className={statusConfig[lead.status]?.className ?? statusConfig.new.className}>
                    {statusConfig[lead.status]?.label ?? lead.status}
                  </Badge>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedId === lead.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedId === lead.id && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem icon={Globe} label="Domain" value={lead.domain_url} />
                    <DetailItem icon={Mail} label="Email" value={lead.email} />
                    <DetailItem icon={MessageCircle} label="WhatsApp" value={lead.whatsapp} />
                    <DetailItem icon={Clock} label="Turnaround" value={lead.turnaround_hours ? `${lead.turnaround_hours}h` : undefined} />
                  </div>

                  {lead.pain_points && lead.pain_points.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pain Points</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lead.pain_points.map((p) => (
                          <Badge key={p} className="bg-secondary/10 text-secondary">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.description && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</p>
                      <p className="mt-2 text-sm text-foreground/80">{lead.description}</p>
                    </div>
                  )}

                  {lead.estimated_cost_min != null && lead.estimated_cost_max != null && (
                    <div className="mt-4 rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estimate</p>
                      <p className="mt-1 font-mono-data text-sm font-semibold text-foreground">
                        ₦{lead.estimated_cost_min.toLocaleString()} — ₦{lead.estimated_cost_max.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Status changer */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Update Status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['new', 'contacted', 'won', 'lost'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateLeadStatus(lead.id, status)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                            lead.status === status
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {convertingLeadId === lead.id ? (
                    <div className="mt-5 space-y-3 rounded-xl border border-primary/20 bg-background p-4">
                      <div>
                        <p className="text-sm font-semibold">Convert this diagnostic into a customer ticket</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Use the email on the diagnostic or enter the email on the customer's existing HostSuite account. The diagnostic and WhatsApp conversation remain the original intake record.</p>
                      </div>
                      <div>
                        <Label htmlFor={`email-${lead.id}`}>Customer HostSuite account email</Label>
                        <Input id={`email-${lead.id}`} type="email" value={conversionEmail} onChange={(event) => setConversionEmail(event.target.value)} className="mt-1" placeholder="The email used to create their HostSuite account" />
                      </div>
                      <div>
                        <Label htmlFor={`scope-${lead.id}`}>Agreed work scope</Label>
                        <Textarea id={`scope-${lead.id}`} value={conversionScope} onChange={(event) => setConversionScope(event.target.value)} className="mt-1 min-h-24" placeholder="Record what HostSuite agreed to deliver..." />
                      </div>
                      <div>
                        <Label htmlFor={`amount-${lead.id}`}>Final agreed amount (NGN)</Label>
                        <Input id={`amount-${lead.id}`} type="number" min="0" step="0.01" value={conversionAmount} onChange={(event) => setConversionAmount(event.target.value)} className="mt-1" placeholder="Leave blank if not yet priced" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleConvertLead(lead.id)} disabled={converting}>{converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create customer ticket</Button>
                        <Button size="sm" variant="outline" onClick={() => setConvertingLeadId(null)} disabled={converting}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Button size="sm" variant="outline" onClick={() => { setConvertingLeadId(lead.id); setConversionScope(lead.description ?? ''); setConversionEmail(lead.email ?? ''); setConversionAmount(''); }}>
                        Convert to customer ticket
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Manual Lead Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Plus className="h-5 w-5 text-primary" /> Add Manual Lead
              </h3>
              <button onClick={() => setAddOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Log a client who reached out via WhatsApp or phone first.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="lead-company">Company Name</Label>
                <Input
                  id="lead-company"
                  value={addForm.company_name}
                  onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })}
                  placeholder="Acme Ltd."
                />
              </div>
              <div>
                <Label htmlFor="lead-domain">Domain</Label>
                <Input
                  id="lead-domain"
                  value={addForm.domain_url}
                  onChange={(e) => setAddForm({ ...addForm, domain_url: e.target.value })}
                  placeholder="acme.com.ng"
                />
              </div>
              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="contact@acme.com.ng"
                />
              </div>
              <div>
                <Label htmlFor="lead-whatsapp">WhatsApp Number</Label>
                <Input
                  id="lead-whatsapp"
                  value={addForm.whatsapp}
                  onChange={(e) => setAddForm({ ...addForm, whatsapp: e.target.value })}
                  placeholder="2348142243764"
                />
              </div>
              <div>
                <Label htmlFor="lead-desc">Description</Label>
                <Textarea
                  id="lead-desc"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Client reached out via WhatsApp about email spam issues..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddLead} disabled={adding} className="gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Globe;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

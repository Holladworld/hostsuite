'use client';

import { useState } from 'react';
import {
  Ticket,
  Loader2,
  ChevronRight,
  User,
  Globe,
  Clock,
  FileText,
  Plus,
  X,
  Server,
} from 'lucide-react';
import { useAdminTickets, useAdminClients } from '@/hooks/use-admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { TicketRow, TicketStatus } from '@/lib/types';

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: 'Received', className: 'bg-info/10 text-info border-info/30' },
  in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/30' },
  resolved: { label: 'Completed', className: 'bg-success/10 text-success border-success/30' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
};

const priorityConfig: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  normal: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  emergency: 'bg-destructive/10 text-destructive',
};

export function AdminTicketsPanel() {
  const { tickets, loading, updateTicket } = useAdminTickets();
  const { clients, addClientDomain, createTicketOnBehalf } = useAdminClients();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string | undefined>>({});
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Domain form
  const [domainForm, setDomainForm] = useState({
    user_id: '',
    domain: '',
    plan_tier: 'starter_ops' as 'starter_ops' | 'managed_growth' | 'enterprise',
    status: 'active' as 'active' | 'maintenance' | 'backup_complete' | 'security_clean' | 'expiring',
    ssl_active: true,
  });

  // Ticket form
  const [ticketForm, setTicketForm] = useState({
    user_id: '',
    domain: '',
    subject: '',
    details: '',
    request_type: 'other' as string,
    priority: 'normal' as 'low' | 'normal' | 'high' | 'emergency',
  });

  async function handleStatusChange(ticket: TicketRow, status: TicketStatus) {
    const ok = await updateTicket(ticket.id, {
      status,
      resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
    });
    if (ok) {
      toast.success(`Ticket marked as ${statusConfig[status].label}.`);
    } else {
      toast.error('Failed to update ticket status.');
    }
  }

  async function handleSaveNotes(ticketId: string) {
    const notes = notesDraft[ticketId];
    if (notes === undefined) return;
    const ok = await updateTicket(ticketId, { admin_notes: notes });
    if (ok) {
      toast.success('Admin notes saved.');
      setNotesDraft((prev) => ({ ...prev, [ticketId]: undefined }));
    } else {
      toast.error('Failed to save notes.');
    }
  }

  async function handleAddDomain() {
    if (!domainForm.user_id || !domainForm.domain) {
      toast.error('Select a client and enter a domain.');
      return;
    }
    setBusy(true);
    const result = await addClientDomain(domainForm);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Domain ${domainForm.domain} assigned to client.`);
      setDomainModalOpen(false);
      setDomainForm({ user_id: '', domain: '', plan_tier: 'starter_ops', status: 'active', ssl_active: true });
    }
  }

  async function handleCreateTicket() {
    if (!ticketForm.user_id || !ticketForm.subject) {
      toast.error('Select a client and enter a subject.');
      return;
    }
    setBusy(true);
    const result = await createTicketOnBehalf({
      user_id: ticketForm.user_id,
      domain: ticketForm.domain || undefined,
      subject: ticketForm.subject,
      details: ticketForm.details || undefined,
      request_type: ticketForm.request_type,
      priority: ticketForm.priority,
    });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Support ticket logged for client.');
      setTicketModalOpen(false);
      setTicketForm({ user_id: '', domain: '', subject: '', details: '', request_type: 'other', priority: 'normal' });
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Ticket className="h-5 w-5 text-primary" /> Client Requests &amp; Tickets
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All support tickets from the client portal. Status updates sync live to the client timeline.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDomainModalOpen(true)} variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" /> Add Client Domain
          </Button>
          <Button onClick={() => setTicketModalOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Manual Ticket
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card py-16 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No support tickets yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/20"
            >
              <button
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{ticket.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ticket.domain || 'No domain'} · {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={priorityConfig[ticket.priority ?? 'normal'] ?? priorityConfig.normal}>
                    {ticket.priority ?? 'normal'}
                  </Badge>
                  <Badge className={statusConfig[ticket.status]?.className ?? statusConfig.open.className}>
                    {statusConfig[ticket.status]?.label ?? ticket.status}
                  </Badge>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedId === ticket.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {expandedId === ticket.id && (
                <div className="border-t border-border bg-muted/20 p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailItem icon={User} label="Client ID" value={ticket.user_id.slice(0, 8) + '…'} />
                    <DetailItem icon={Globe} label="Domain" value={ticket.domain} />
                    <DetailItem icon={Clock} label="Filed" value={new Date(ticket.created_at).toLocaleString()} />
                  </div>

                  {ticket.details && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Client Description</p>
                      <p className="mt-2 text-sm text-foreground/80">{ticket.details}</p>
                    </div>
                  )}

                  {/* Admin notes */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin Notes</p>
                    <Textarea
                      value={notesDraft[ticket.id] ?? ticket.admin_notes ?? ''}
                      onChange={(e) =>
                        setNotesDraft((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                      }
                      placeholder="Add internal notes (visible to admin only)…"
                      className="mt-2 min-h-[80px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveNotes(ticket.id)}
                      className="mt-2 gap-2"
                      disabled={notesDraft[ticket.id] === undefined}
                    >
                      Save Notes
                    </Button>
                  </div>

                  {/* Status controls */}
                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Update Status (syncs to client portal)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(['open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(ticket, status)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                            ticket.status === status
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Client Domain Modal */}
      {domainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Server className="h-5 w-5 text-primary" /> Assign Hosted Domain
              </h3>
              <button onClick={() => setDomainModalOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Assign a domain and SLA tier to a client account.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Client</Label>
                <Select value={domainForm.user_id} onValueChange={(v) => setDomainForm({ ...domainForm, user_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="_none" disabled>No clients available</SelectItem>
                    ) : (
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name || c.corporate_email || c.id.slice(0, 8)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="domain-name">Domain</Label>
                <Input
                  id="domain-name"
                  value={domainForm.domain}
                  onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
                  placeholder="clientdomain.com.ng"
                />
              </div>
              <div>
                <Label>SLA Tier</Label>
                <Select
                  value={domainForm.plan_tier}
                  onValueChange={(v) => setDomainForm({ ...domainForm, plan_tier: v as typeof domainForm.plan_tier })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter_ops">Starter Ops</SelectItem>
                    <SelectItem value="managed_growth">Managed Growth</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Security Status</Label>
                <Select
                  value={domainForm.status}
                  onValueChange={(v) => setDomainForm({ ...domainForm, status: v as typeof domainForm.status })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="backup_complete">Backup Complete</SelectItem>
                    <SelectItem value="security_clean">Security Clean</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ssl-active"
                  checked={domainForm.ssl_active}
                  onChange={(e) => setDomainForm({ ...domainForm, ssl_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="ssl-active" className="text-sm">SSL Active</Label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDomainModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddDomain} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                Assign Domain
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Plus className="h-5 w-5 text-primary" /> Log Support Ticket
              </h3>
              <button onClick={() => setTicketModalOpen(false)} className="rounded-md p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a support ticket on behalf of a client.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Client</Label>
                <Select value={ticketForm.user_id} onValueChange={(v) => setTicketForm({ ...ticketForm, user_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a client…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <SelectItem value="_none" disabled>No clients available</SelectItem>
                    ) : (
                      clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name || c.corporate_email || c.id.slice(0, 8)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticket-domain">Domain (optional)</Label>
                <Input
                  id="ticket-domain"
                  value={ticketForm.domain}
                  onChange={(e) => setTicketForm({ ...ticketForm, domain: e.target.value })}
                  placeholder="clientdomain.com.ng"
                />
              </div>
              <div>
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  placeholder="Email not delivering to Gmail"
                />
              </div>
              <div>
                <Label>Request Type</Label>
                <Select
                  value={ticketForm.request_type}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, request_type: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text_update">Text Update</SelectItem>
                    <SelectItem value="email_setup">Email Setup</SelectItem>
                    <SelectItem value="database_backup">Database / Backup</SelectItem>
                    <SelectItem value="downtime">Downtime</SelectItem>
                    <SelectItem value="migration">Migration</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v as typeof ticketForm.priority })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticket-details">Details</Label>
                <Textarea
                  id="ticket-details"
                  value={ticketForm.details}
                  onChange={(e) => setTicketForm({ ...ticketForm, details: e.target.value })}
                  placeholder="Describe the issue the client reported…"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTicketModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={busy} className="gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Ticket
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
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

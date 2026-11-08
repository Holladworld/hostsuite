'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Send, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SUPPORT_PROBLEM_TYPES, getSupportPriorityLabel, type SupportProblemType } from '@/lib/support';
import { supabase, useAuth } from '@/lib/supabase-client';
import { toast } from 'sonner';

type TicketRow = {
  id: string;
  subject: string;
  details: string | null;
  priority: string;
  status: string;
  domain: string | null;
  created_at: string;
  agreed_scope: string | null;
  quoted_amount: number | null;
  quote_currency: string;
  quote_status: string;
  current_quote_revision_id: string | null;
};
type QuoteRevision = { id: string; ticket_id: string; revision: number; agreed_scope: string; amount: number; currency: string; status: string; change_reason: string | null; created_at: string };

function statusLabel(status: string) {
  return status.replaceAll('_', ' ');
}

export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [problem, setProblem] = useState<SupportProblemType | null>(null);
  const [details, setDetails] = useState('');
  const [domain, setDomain] = useState('');
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingTicketId, setPayingTicketId] = useState<string | null>(null);
  const [quoteRevisions, setQuoteRevisions] = useState<QuoteRevision[]>([]);

  const loadTickets = useCallback(async () => {
    if (!user) return;
    setTicketsLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id,subject,details,priority,status,domain,created_at,agreed_scope,quoted_amount,quote_currency,quote_status,current_quote_revision_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('We could not load your ticket history.');
    } else {
      const rows = (data ?? []) as TicketRow[];
      setTickets(rows);
      if (rows.length) {
        const { data: quoteRows, error: quoteError } = await supabase
          .from('ticket_quote_revisions')
          .select('id,ticket_id,revision,agreed_scope,amount,currency,status,change_reason,created_at')
          .in('ticket_id', rows.map((ticket) => ticket.id))
          .order('revision', { ascending: false });
        if (!quoteError) setQuoteRevisions((quoteRows ?? []) as QuoteRevision[]);
      } else {
        setQuoteRevisions([]);
      }
    }
    setTicketsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/portal');
    if (user) void loadTickets();
  }, [authLoading, user, router, loadTickets]);

  async function payApprovedQuote(ticket: TicketRow) {
    if (!ticket.current_quote_revision_id || ticket.quote_status !== 'awaiting_payment') return;
    setPayingTicketId(ticket.id);
    try {
      const response = await fetch(`/api/billing/tickets/${ticket.id}/checkout`, { method: 'POST' });
      const result = await response.json() as { error?: string; authorizationUrl?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? 'Unable to start payment.');
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start payment.');
      setPayingTicketId(null);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      router.push('/portal');
      return;
    }
    if (!problem) {
      toast.error('Choose the type of issue first.');
      return;
    }
    const selected = SUPPORT_PROBLEM_TYPES.find((item) => item.type === problem);
    if (!selected) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        domain: domain.trim() || null,
        request_type: problem,
        subject: selected.label,
        details: details.trim(),
        priority: selected.priority,
        status: 'open',
      })
      .select('id,subject,details,priority,status,domain,created_at,agreed_scope,quoted_amount,quote_currency,quote_status')
      .single();

    if (error) {
      toast.error('Your request could not be saved. Please try again.');
      setSubmitting(false);
      return;
    }

    setTickets((current) => [data as TicketRow, ...current]);
    setProblem(null);
    setDetails('');
    setDomain('');
    toast.success('Your support request has been saved.');
    setSubmitting(false);
  }

  if (authLoading || (!user && ticketsLoading)) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link href="/portal/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to portal</Link>
          <Link href="/" className="font-display text-lg font-bold tracking-tight">HostSuite</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-medium text-primary">Support &amp; requests</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Your requests, in one place.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Raise a new request or return to an earlier one. Each request keeps its own history under your HostSuite account.</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start a new support request</CardTitle>
              <CardDescription>Choose what you need help with. HostSuite will review the request and confirm whether additional work or charges apply before proceeding.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {SUPPORT_PROBLEM_TYPES.map((item) => (
                <button type="button" key={item.type} onClick={() => setProblem(item.type)} className={`rounded-xl border p-4 text-left transition-colors ${problem === item.type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{getSupportPriorityLabel(item.priority)}</p></div>
                    {item.priority === 'emergency' && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {problem && (
            <Card>
              <CardHeader><CardTitle>Tell us a little more</CardTitle><CardDescription>Include the website or email domain if it is relevant.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="Website or domain (optional)" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="What are you seeing? When did it start?" className="min-h-32" required />
                {SUPPORT_PROBLEM_TYPES.find((item) => item.type === problem)?.priority === 'emergency' && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6 text-destructive">This request will be marked as an emergency for staff review. Submission does not itself guarantee 24/7 response or automated escalation.</div>}
                <Button type="submit" disabled={submitting} className="gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Save support request</Button>
              </CardContent>
            </Card>
          )}
        </form>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="font-display text-xl font-semibold">Your ticket history</h2><p className="mt-1 text-sm text-muted-foreground">Every request remains attached to this account.</p></div>
            <Badge variant="outline">{tickets.length} {tickets.length === 1 ? 'request' : 'requests'}</Badge>
          </div>
          {ticketsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : tickets.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed p-8 text-center"><Ticket className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-medium">No requests yet</p><p className="mt-1 text-sm text-muted-foreground">Your new support requests and converted diagnostic tickets will appear here.</p></div>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="font-semibold">{ticket.subject}</h3><p className="mt-1 text-xs text-muted-foreground">{ticket.domain || 'No domain attached'} · {new Date(ticket.created_at).toLocaleString()}</p></div>
                      <div className="flex gap-2"><Badge variant="outline" className="capitalize">{statusLabel(ticket.status)}</Badge><Badge variant="secondary" className="capitalize">{ticket.priority}</Badge></div>
                    </div>
                    {ticket.details && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{ticket.details}</p>}
                    {ticket.agreed_scope && <div className="mt-3 rounded-lg bg-muted/50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agreed work</p><p className="mt-1 text-sm">{ticket.agreed_scope}</p></div>}
                    {ticket.quoted_amount !== null && (
                      <div className="mt-3 rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest approved quote</p>
                            <p className="mt-1 text-lg font-semibold">{ticket.quote_currency} {Number(ticket.quoted_amount).toLocaleString()}</p>
                            <p className="text-xs capitalize text-muted-foreground">{statusLabel(ticket.quote_status)}</p>
                          </div>
                          {ticket.quote_status === 'awaiting_payment' && ticket.current_quote_revision_id && (
                            <Button size="sm" onClick={() => payApprovedQuote(ticket)} disabled={payingTicketId === ticket.id}>
                              {payingTicketId === ticket.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Pay approved amount
                            </Button>
                          )}
                          {ticket.quote_status === 'paid' && <Badge>Paid</Badge>}
                        </div>
                        {quoteRevisions.filter((quote) => quote.ticket_id === ticket.id).length > 1 && (
                          <details className="mt-3 border-t pt-3">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">Quote revision history</summary>
                            <div className="mt-2 space-y-2">
                              {quoteRevisions.filter((quote) => quote.ticket_id === ticket.id).map((quote) => (
                                <div key={quote.id} className="flex flex-wrap items-start justify-between gap-2 text-xs">
                                  <div><p className="font-medium">Revision {quote.revision} · {quote.currency} {Number(quote.amount).toLocaleString()}</p><p className="mt-0.5 text-muted-foreground">{quote.change_reason || 'Quote issued'}</p></div>
                                  <span className="capitalize text-muted-foreground">{quote.status.replaceAll('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          Need to discuss a diagnostic with a person? You can still use the public <Link href="/#diagnostic" className="font-medium text-primary underline underline-offset-4">diagnostic form</Link>. It will continue saving your request and opening WhatsApp for direct discussion.
        </div>
        <div className="mt-6"><Button asChild variant="outline"><Link href="/portal/dashboard">Back to dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
      </main>
    </div>
  );
}

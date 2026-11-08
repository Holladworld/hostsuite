import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient, verifyAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type Payload = { scope?: unknown; amount?: unknown; currency?: unknown; reason?: unknown };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id: ticketId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket reference.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null) as Payload | null;
  const scope = typeof body?.scope === 'string' ? body.scope.trim() : '';
  const amount = body?.amount === '' || body?.amount == null ? NaN : Number(body.amount);
  const currency = typeof body?.currency === 'string' ? body.currency : 'NGN';
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';

  if (!scope || scope.length > 10000) return NextResponse.json({ error: 'Enter the complete agreed work scope.' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99) return NextResponse.json({ error: 'Enter a valid amount greater than zero.' }, { status: 400 });
  if (currency !== 'NGN') return NextResponse.json({ error: 'Ticket checkout currently supports NGN only.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminSupabaseClient();
  const { data: ticket, error: ticketError } = await admin.from('support_tickets').select('id,quote_status').eq('id', ticketId).maybeSingle();
  if (ticketError) return NextResponse.json({ error: 'Could not load this ticket.' }, { status: 500 });
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
  if (ticket.quote_status === 'paid') return NextResponse.json({ error: 'This quote has already been paid and is locked. Create a separate ticket for additional work.' }, { status: 409 });

  const { data: revisionId, error } = await admin.rpc('create_ticket_quote_revision', {
    p_ticket_id: ticketId,
    p_scope: scope,
    p_amount: amount,
    p_currency: currency,
    p_reason: reason || null,
    p_created_by: user?.id ?? null,
  });
  if (error || !revisionId) {
    const message = error?.message ?? '';
    if (message.includes('PAID_QUOTE_LOCKED')) return NextResponse.json({ error: 'This quote has already been paid and is locked.' }, { status: 409 });
    return NextResponse.json({ error: 'Could not save this quote revision.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, revisionId });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const { id: ticketId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketId)) {
    return NextResponse.json({ error: 'Invalid ticket reference.' }, { status: 400 });
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('ticket_quote_revisions')
    .select('id,revision,agreed_scope,amount,currency,status,change_reason,created_at,created_by')
    .eq('ticket_id', ticketId).order('revision', { ascending: false });
  if (error) return NextResponse.json({ error: 'Could not load quote history.' }, { status: 500 });
  return NextResponse.json({ revisions: data ?? [] });
}

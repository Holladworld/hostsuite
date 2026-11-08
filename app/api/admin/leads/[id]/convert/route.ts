import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';

type ConvertPayload = {
  agreedScope?: unknown;
  quotedAmount?: unknown;
  quoteCurrency?: unknown;
  customerEmail?: unknown;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { id: leadId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(leadId)) {
    return NextResponse.json({ error: 'Invalid diagnostic reference.' }, { status: 400 });
  }
  const body = (await request.json().catch(() => null)) as ConvertPayload | null;
  const agreedScope = typeof body?.agreedScope === 'string' ? body.agreedScope.trim().slice(0, 10000) : '';
  const requestedEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim().toLowerCase() : '';
  const quotedAmount = body?.quotedAmount === '' || body?.quotedAmount == null ? null : Number(body.quotedAmount);
  const quoteCurrency = typeof body?.quoteCurrency === 'string' && /^[A-Z]{3}$/.test(body.quoteCurrency)
    ? body.quoteCurrency
    : 'NGN';

  if (!agreedScope) return NextResponse.json({ error: 'Record the agreed scope before creating a ticket.' }, { status: 400 });
  if (quotedAmount !== null && (!Number.isFinite(quotedAmount) || quotedAmount < 0)) {
    return NextResponse.json({ error: 'Enter a valid agreed amount.' }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: lead, error: leadError } = await admin.from('leads').select('*').eq('id', leadId).maybeSingle();
  if (leadError) return NextResponse.json({ error: 'Could not load this diagnostic.' }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'Diagnostic not found.' }, { status: 404 });

  const { data: existingTicket } = await admin.from('support_tickets').select('id').eq('lead_id', leadId).maybeSingle();
  if (existingTicket) {
    return NextResponse.json({ error: 'This diagnostic has already been converted.', ticketId: existingTicket.id }, { status: 409 });
  }

  const email = requestedEmail || (typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '');
  if (!email) return NextResponse.json({ error: 'This diagnostic has no customer email. Add an email to the lead before conversion.' }, { status: 422 });

  let customer = null as Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user'] | null;
  for (let page = 1; !customer; page += 1) {
    const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: 'Could not verify the customer account.' }, { status: 500 });
    customer = userPage.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (customer || userPage.users.length < 1000) break;
  }
  if (!customer) {
    return NextResponse.json({ error: 'No HostSuite account matches this email yet. Ask the customer to create an account with this email, then convert the diagnostic.' }, { status: 409 });
  }

  const painPoints = Array.isArray(lead.pain_points) ? lead.pain_points.filter((value: unknown): value is string => typeof value === 'string') : [];
  const subject = painPoints.length ? `Diagnostic: ${painPoints.slice(0, 2).join(', ')}` : 'Diagnostic support request';
  const details = [
    lead.description ? `Customer description:\n${lead.description}` : '',
    lead.estimated_cost_min != null && lead.estimated_cost_max != null
      ? `Initial estimate: ₦${Number(lead.estimated_cost_min).toLocaleString()} – ₦${Number(lead.estimated_cost_max).toLocaleString()}`
      : '',
    `Agreed scope:\n${agreedScope}`,
    lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '',
  ].filter(Boolean).join('\n\n');

  const { data: ticket, error: ticketError } = await admin.from('support_tickets').insert({
    user_id: customer.id,
    lead_id: leadId,
    domain: lead.domain_url,
    request_type: 'other',
    subject,
    details,
    priority: 'normal',
    status: 'open',
    agreed_scope: agreedScope,
    quoted_amount: quotedAmount,
    quote_currency: quoteCurrency,
    quote_status: quotedAmount === null ? 'not_quoted' : quotedAmount === 0 ? 'waived' : 'awaiting_payment',
  }).select('id').single();

  if (ticketError || !ticket) {
    return NextResponse.json({ error: 'Could not create the customer ticket.' }, { status: 500 });
  }

  const { error: updateError } = await admin.from('leads').update({
    linked_user_id: customer.id,
    converted_at: new Date().toISOString(),
    status: 'won',
  }).eq('id', leadId);

  if (updateError) {
    await admin.from('support_tickets').delete().eq('id', ticket.id);
    return NextResponse.json({ error: 'Ticket creation could not be completed. No ticket was retained; please retry.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, ticketId: ticket.id, customerId: customer.id });
}

import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createServerSupabaseClient, verifyAdmin } from '@/lib/supabase-server';

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
  if (quoteCurrency !== 'NGN') return NextResponse.json({ error: 'Ticket quote checkout currently supports NGN only.' }, { status: 400 });
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

  let customer: { id: string; email?: string } | null = null;
  for (let page = 1; !customer; page += 1) {
    const { data: userPage, error: usersError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (usersError) return NextResponse.json({ error: 'Could not verify the customer account.' }, { status: 500 });
    customer = userPage.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (customer || userPage.users.length < 1000) break;
  }
  if (!customer) {
    return NextResponse.json({ error: 'No HostSuite account matches this email yet. Ask the customer to create an account with this email, then convert the diagnostic.' }, { status: 409 });
  }

  const { data: ticketId, error: conversionError } = await admin.rpc('convert_diagnostic_lead_to_ticket', {
    p_lead_id: leadId,
    p_user_id: customer.id,
    p_agreed_scope: agreedScope,
    p_quoted_amount: quotedAmount,
    p_quote_currency: quoteCurrency,
  });

  if (conversionError || !ticketId) {
    const message = conversionError?.message ?? '';
    if (message.includes('LEAD_ALREADY_CONVERTED')) {
      return NextResponse.json({ error: 'This diagnostic has already been converted.' }, { status: 409 });
    }
    if (message.includes('LEAD_NOT_FOUND')) {
      return NextResponse.json({ error: 'Diagnostic not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Could not convert this diagnostic into a customer ticket.' }, { status: 500 });
  }

  if (quotedAmount !== null && quotedAmount > 0) {
    const server = await createServerSupabaseClient();
    const { data: { user: adminUser } } = await server.auth.getUser();
    const { error: quoteError } = await admin.rpc('create_ticket_quote_revision', {
      p_ticket_id: ticketId,
      p_scope: agreedScope,
      p_amount: quotedAmount,
      p_currency: quoteCurrency,
      p_reason: 'Initial quote agreed during diagnostic conversion',
      p_created_by: adminUser?.id ?? null,
    });
    if (quoteError) {
      return NextResponse.json({ error: 'The ticket was created, but its initial quote could not be saved. Open the ticket and create the quote from the admin Tickets panel.' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, ticketId, customerId: customer.id });
}

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProvider } from '@/lib/payments/providers';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket reference.' }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const { data: ticket, error: ticketError } = await admin.from('support_tickets')
      .select('id,user_id,current_quote_revision_id,quote_status')
      .eq('id', ticketId).eq('user_id', user.id).maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    if (!ticket.current_quote_revision_id || ticket.quote_status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'There is no approved quote ready for payment.' }, { status: 409 });
    }

    const { data: quote, error: quoteError } = await admin.from('ticket_quote_revisions')
      .select('id,ticket_id,amount,currency,status')
      .eq('id', ticket.current_quote_revision_id).eq('ticket_id', ticket.id).maybeSingle();
    if (quoteError) throw quoteError;
    if (!quote || quote.status !== 'awaiting_payment' || quote.currency !== 'NGN' || Number(quote.amount) <= 0) {
      return NextResponse.json({ error: 'This quote is no longer available for payment. Refresh the ticket.' }, { status: 409 });
    }

    const { data: existing, error: existingError } = await admin.from('billing_orders')
      .select('id,status,currency,total,provider,provider_reference,metadata')
      .eq('user_id', user.id)
      .contains('metadata', { source: 'ticket_quote', ticket_quote_revision_id: quote.id })
      .maybeSingle();
    if (existingError) throw existingError;

    let order = existing;
    let invoiceNumber = '';
    if (order?.status === 'paid') return NextResponse.json({ error: 'This quote has already been paid.' }, { status: 409 });
    if (order && order.status !== 'pending') {
      const { data: reopened, error } = await admin.from('billing_orders')
        .update({ status: 'pending' }).eq('id', order.id).select('id,status,currency,total,provider,provider_reference,metadata').single();
      if (error) throw error;
      order = reopened;
    }

    if (!order) {
      const provider = getPaymentProvider();
      if (!provider.isConfigured()) return NextResponse.json({ error: 'Payment is temporarily unavailable.' }, { status: 503 });
      const reference = `HS-TICKET-${crypto.randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`;
      const idempotencyKey = crypto.randomUUID();
      const invoice = `HS-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
      const { data: created, error: orderError } = await admin.from('billing_orders').insert({
        user_id: user.id, status: 'pending', currency: quote.currency, subtotal: quote.amount, total: quote.amount,
        provider: provider.name, provider_reference: reference, idempotency_key: idempotencyKey,
        metadata: { source: 'ticket_quote', ticket_id: ticket.id, ticket_quote_revision_id: quote.id },
      }).select('id,status,currency,total,provider,provider_reference,metadata').single();
      if (orderError) throw orderError;
      order = created;
      invoiceNumber = invoice;
      const { error: itemError } = await admin.from('billing_order_items').insert({
        order_id: order.id, product_name: `HostSuite support ticket ${ticket.id.slice(0, 8)} — quote ${quote.id.slice(0, 8)}`,
        quantity: 1, unit_price: quote.amount, total: quote.amount,
        metadata: { source: 'ticket_quote', ticket_id: ticket.id, ticket_quote_revision_id: quote.id },
      });
      if (itemError) throw itemError;
      const { error: invoiceError } = await admin.from('billing_invoices').insert({
        user_id: user.id, order_id: order.id, invoice_number: invoice, status: 'open',
        currency: quote.currency, subtotal: quote.amount, total: quote.amount,
      });
      if (invoiceError) throw invoiceError;
    } else {
      const { data: invoice } = await admin.from('billing_invoices').select('invoice_number').eq('order_id', order.id).maybeSingle();
      invoiceNumber = invoice?.invoice_number ?? '';
    }

    if (Number(order.total) !== Number(quote.amount) || order.currency !== quote.currency) {
      return NextResponse.json({ error: 'The saved payment order does not match the current approved quote. Contact HostSuite.' }, { status: 409 });
    }
    const savedAuthorizationUrl = typeof order.metadata?.authorization_url === 'string' ? order.metadata.authorization_url : '';
    if (savedAuthorizationUrl) {
      return NextResponse.json({ authorizationUrl: savedAuthorizationUrl, reference: order.provider_reference, orderId: order.id, invoiceNumber });
    }
    const provider = getPaymentProvider(order.provider || undefined);
    if (!provider.isConfigured()) return NextResponse.json({ error: 'Payment is temporarily unavailable.' }, { status: 503 });
    const origin = new URL(request.url).origin;
    const payment = await provider.initialize({
      email: user.email, amount: Number(quote.amount), currency: quote.currency,
      reference: order.provider_reference, callbackUrl: `${origin}/portal/support?payment=return`,
      orderId: order.id, userId: user.id,
    });
    const { data: latestTicket, error: latestTicketError } = await admin.from('support_tickets')
      .select('current_quote_revision_id,quote_status').eq('id', ticket.id).single();
    if (latestTicketError) throw latestTicketError;
    if (latestTicket.current_quote_revision_id !== quote.id || latestTicket.quote_status !== 'awaiting_payment') {
      return NextResponse.json({ error: 'This quote changed while checkout was starting. Refresh the ticket and use the latest amount.' }, { status: 409 });
    }
    const { error: metadataError } = await admin.from('billing_orders').update({
      metadata: { ...((order.metadata ?? {}) as Record<string, unknown>), authorization_url: payment.authorizationUrl, checkout_initialized_at: new Date().toISOString() },
    }).eq('id', order.id).eq('status', 'pending');
    if (metadataError) throw metadataError;
    await admin.from('support_tickets').update({ billing_order_id: order.id }).eq('id', ticket.id).eq('current_quote_revision_id', quote.id);
    return NextResponse.json({ authorizationUrl: payment.authorizationUrl, reference: order.provider_reference, orderId: order.id, invoiceNumber });
  } catch (error) {
    console.error('Ticket quote checkout failed', error);
    return NextResponse.json({ error: 'Unable to start payment. Please try again.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProviderStatus } from '@/lib/payments/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authenticated = await getVerifiedUser(request);
    const user = authenticated?.user;
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    // Finalize subscriptions whose customer opted out and whose paid-through date has elapsed.
    const { error: expiryError } = await admin.from('billing_subscriptions').update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('auto_renew', false)
      .eq('cancel_at_period_end', true)
      .eq('status', 'active')
      .lte('current_period_end', new Date().toISOString());
    if (expiryError) throw expiryError;

    const [orders, invoices, subscriptions] = await Promise.all([
      admin.from('billing_orders').select('id,status,currency,total,provider,provider_reference,created_at,paid_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      admin.from('billing_invoices').select('id,invoice_number,status,currency,total,due_at,paid_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      admin.from('billing_subscriptions').select('id,service_name,amount,currency,interval,status,next_billing_at,auto_renew,provider,cancel_at_period_end,current_period_end').eq('user_id', user.id).order('next_billing_at', { ascending: true }).limit(20),
    ]);
    if (orders.error) throw orders.error;
    if (invoices.error) throw invoices.error;
    if (subscriptions.error) throw subscriptions.error;

    return NextResponse.json({ provider: getPaymentProviderStatus(), orders: orders.data ?? [], invoices: invoices.data ?? [], subscriptions: subscriptions.data ?? [] });
  } catch (error) {
    console.error('Billing summary failed', error);
    return NextResponse.json({ error: 'We could not load your billing information right now.' }, { status: 500 });
  }
}

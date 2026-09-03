import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getPaymentProviderStatus } from '@/lib/payments/providers';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const [orders, invoices, subscriptions] = await Promise.all([
      admin.from('billing_orders').select('id,status,currency,total,provider,provider_reference,created_at,paid_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      admin.from('billing_invoices').select('id,invoice_number,status,currency,total,due_at,paid_at,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      admin.from('billing_subscriptions').select('id,service_name,amount,currency,interval,status,next_billing_at,auto_renew').eq('user_id', user.id).order('next_billing_at', { ascending: true }).limit(20),
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

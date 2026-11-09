import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  const authenticated = await getVerifiedUser(request);
  const user = authenticated?.user;
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const reference = new URL(request.url).searchParams.get('reference');
  const parsed = z.string().min(8).max(160).safeParse(reference);
  if (!parsed.success) return NextResponse.json({ error: 'A valid payment reference is required.' }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { data: order, error } = await admin
    .from('billing_orders')
    .select('id,status,total,currency,provider_reference,metadata,paid_at')
    .eq('user_id', user.id)
    .eq('provider_reference', parsed.data)
    .eq('metadata->>source', 'managed_plan')
    .maybeSingle();
  if (error) {
    console.error('Managed plan payment status lookup failed', error);
    return NextResponse.json({ error: 'We could not check this payment yet.' }, { status: 500 });
  }
  if (!order) return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });

  const { data: subscription } = await admin.from('billing_subscriptions')
    .select('id,status,interval,next_billing_at,auto_renew')
    .eq('source_order_id', order.id)
    .maybeSingle();

  return NextResponse.json({
    status: order.status === 'paid' && !subscription ? 'processing' : order.status,
    amount: order.total,
    currency: order.currency,
    planName: order.metadata?.plan_name ?? 'Managed care',
    interval: order.metadata?.interval ?? null,
    subscription: subscription ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}

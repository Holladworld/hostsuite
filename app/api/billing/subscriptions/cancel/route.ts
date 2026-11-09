import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getVerifiedUser } from '@/lib/supabase-auth';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const authenticated = await getVerifiedUser(request);
    const user = authenticated?.user;
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const parsed = z.object({ subscriptionId: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'A valid subscription is required.' }, { status: 400 });

    const admin = createAdminSupabaseClient();
    const { data: subscription, error: lookupError } = await admin.from('billing_subscriptions')
      .select('id,provider,current_period_end,auto_renew,status')
      .eq('id', parsed.data.subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!subscription) return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    if (!subscription.auto_renew) return NextResponse.json({ success: true, message: 'Automatic renewal is already off.' });

    const { data: credentials, error: credentialsError } = await admin.from('billing_subscription_provider_credentials')
      .select('provider_subscription_id,provider_subscription_token,provider_plan_id,provider_customer_email')
      .eq('subscription_id', subscription.id)
      .maybeSingle();
    if (credentialsError) throw credentialsError;
    if (!credentials) return NextResponse.json({ error: 'The payment provider has not finished linking this subscription. Please try again shortly or contact support.' }, { status: 409 });

    if (subscription.provider === 'paystack') {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 });
      if (!credentials.provider_subscription_id || !credentials.provider_subscription_token) {
        return NextResponse.json({ error: 'The payment provider has not finished linking this subscription. Please try again shortly or contact support.' }, { status: 409 });
      }
      const response = await fetch('https://api.paystack.co/subscription/disable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: credentials.provider_subscription_id, token: credentials.provider_subscription_token }),
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || !result.status) throw new Error('PAYSTACK_CANCELLATION_FAILED');
    } else if (subscription.provider === 'flutterwave') {
      const secret = process.env.FLW_SECRET_KEY;
      if (!secret) return NextResponse.json({ error: 'Flutterwave is not configured.' }, { status: 503 });
      const providerSubscriptionId = credentials.provider_subscription_id as string | null;
      // Never cancel a mandate inferred only from matching customer email and plan.
      if (!providerSubscriptionId) {
        return NextResponse.json({ error: 'The payment provider has not finished linking this subscription. Please try again shortly or contact support.' }, { status: 409 });
      }
      const response = await fetch(`https://api.flutterwave.com/v3/subscriptions/${encodeURIComponent(providerSubscriptionId)}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${secret}` },
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok || result?.status !== 'success') throw new Error('FLUTTERWAVE_CANCELLATION_FAILED');
    } else {
      return NextResponse.json({ error: 'This subscription does not have a supported recurring payment provider.' }, { status: 409 });
    }

    const now = new Date();
    const paidThrough = subscription.current_period_end && new Date(subscription.current_period_end) > now;
    const { error: updateError } = await admin.from('billing_subscriptions').update({
      auto_renew: false,
      cancel_at_period_end: true,
      cancelled_at: now.toISOString(),
      status: paidThrough ? 'active' : 'cancelled',
    }).eq('id', subscription.id).eq('user_id', user.id);
    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: paidThrough
        ? `Automatic renewal is off. Your managed-care service remains active through ${new Date(subscription.current_period_end).toLocaleDateString()}.`
        : 'Automatic renewal is off.',
    });
  } catch (error) {
    console.error('Managed subscription cancellation failed', error);
    return NextResponse.json({ error: 'We could not cancel automatic renewal. Please try again or contact support.' }, { status: 500 });
  }
}

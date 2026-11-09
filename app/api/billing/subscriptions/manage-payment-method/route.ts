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
    const { data: subscription, error } = await admin.from('billing_subscriptions')
      .select('id,provider')
      .eq('id', parsed.data.subscriptionId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!subscription) return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    if (subscription.provider !== 'paystack') {
      return NextResponse.json({ error: 'Please contact HostSuite support to update this payment method.' }, { status: 409 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 });
    const { data: credentials, error: credentialError } = await admin.from('billing_subscription_provider_credentials')
      .select('provider_subscription_id')
      .eq('subscription_id', subscription.id)
      .maybeSingle();
    if (credentialError) throw credentialError;
    if (!credentials?.provider_subscription_id) return NextResponse.json({ error: 'The payment provider has not finished linking this subscription.' }, { status: 409 });

    const response = await fetch(`https://api.paystack.co/subscription/${encodeURIComponent(credentials.provider_subscription_id)}/manage/link`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    const result = await response.json();
    if (!response.ok || !result.status || typeof result.data?.link !== 'string') {
      throw new Error('PAYSTACK_MANAGE_LINK_FAILED');
    }
    return NextResponse.json({ url: result.data.link });
  } catch (error) {
    console.error('Subscription payment method link failed', error);
    return NextResponse.json({ error: 'We could not open the payment-method update page. Please try again or contact support.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { getCheckoutProviderBlock } from '@/lib/billing/checkout-validation';

const serviceSchema = z.enum(['domain', 'hosting', 'email', 'website']);

export async function GET(request: Request) {
  const parsed = serviceSchema.safeParse(new URL(request.url).searchParams.get('service'));
  if (!parsed.success) return NextResponse.json({ error: 'Choose a valid service category.' }, { status: 400 });

  const availabilityMessage = getCheckoutProviderBlock(parsed.data);
  if (availabilityMessage) {
    return NextResponse.json({ products: [], availabilityMessage }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from('billing_products')
      .select('id,name,description,product_type,billing_mode,currency,price,interval')
      .eq('active', true)
      .eq('product_type', parsed.data)
      .eq('billing_mode', 'one_time')
      .order('price', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ products: data ?? [], availabilityMessage: null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Public service catalogue lookup failed', error);
    return NextResponse.json({ error: 'We could not load available services right now.' }, { status: 500 });
  }
}

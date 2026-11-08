import { NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/supabase-auth';

export async function POST(request: Request) {
  const authenticated = await getVerifiedUser(request);
  if (!authenticated) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const body = await request.json().catch(() => null) as { productId?: string; metadata?: Record<string, unknown> } | null;
  if (!body?.productId) return NextResponse.json({ error: 'productId is required.' }, { status: 400 });

  const { data, error } = await authenticated.client.rpc('create_customer_order', {
    p_product_id: body.productId,
    p_metadata: body.metadata ?? {},
  });

  if (error) {
    const status = error.message === 'PRODUCT_NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ orderId: data });
}

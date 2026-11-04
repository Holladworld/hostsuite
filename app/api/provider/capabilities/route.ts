import { NextResponse } from 'next/server';
import { getProviderHealth } from '@/lib/providers/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = getProviderHealth();
    return NextResponse.json({
      provider: health.provider,
      configured: health.configured,
      capabilities: health.capabilities,
    });
  } catch (error) {
    console.error('Provider capability check failed:', error);
    return NextResponse.json({ error: 'Provider is not configured.' }, { status: 503 });
  }
}

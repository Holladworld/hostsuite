import { NextResponse } from 'next/server';
import { getHostingProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const provider = getHostingProvider();
    return NextResponse.json({
      provider: provider.name,
      capabilities: provider.capabilities,
    });
  } catch (error) {
    console.error('Provider capability check failed:', error);
    return NextResponse.json({ error: 'Provider is not configured.' }, { status: 503 });
  }
}

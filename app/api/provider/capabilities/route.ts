import { NextResponse } from 'next/server';
import { getHostingProviderStatus } from '@/lib/providers/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getHostingProviderStatus();
    return NextResponse.json({
      provider: status.provider,
      capabilities: status.supportedCapabilities,
      configuration: {
        mode: status.mode,
        configured: status.configured,
        readyCapabilities: status.readyCapabilities,
      },
    });
  } catch (error) {
    console.error('Provider capability check failed:', error);
    return NextResponse.json({ error: 'Provider is not configured.' }, { status: 503 });
  }
}

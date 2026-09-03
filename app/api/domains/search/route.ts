import { NextResponse } from 'next/server';
import { getHostingProvider } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get('domain')?.trim().toLowerCase();
  if (!domain || domain.length > 253 || !domain.includes('.')) {
    return NextResponse.json({ error: 'Enter a valid domain name.' }, { status: 400 });
  }

  try {
    const result = await getHostingProvider().searchDomain(domain);
    if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: result.code === 'NOT_CONFIGURED' ? 503 : 502 });
    return NextResponse.json({ domain, available: result.data.available });
  } catch (error) {
    console.error('Domain availability check failed:', error);
    return NextResponse.json({ error: 'Domain availability check failed.' }, { status: 502 });
  }
}

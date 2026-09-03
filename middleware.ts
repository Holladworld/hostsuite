import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin route protection is handled client-side via the useAdmin hook.
// The payment rewrite below keeps the existing customer checkout URL stable
// while the server selects Paystack or Flutterwave from PAYMENT_PROVIDER.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === '/api/billing/paystack/initialize') {
    const url = req.nextUrl.clone();
    url.pathname = '/api/billing/initialize';
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/billing/paystack/initialize'],
};
